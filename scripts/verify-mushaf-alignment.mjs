#!/usr/bin/env node
/**
 * Systematic Mushaf prototype alignment audit.
 *
 * Compares pages-index (quran.com word ids) vs ayahinfo bboxes (quran_android)
 * and reports issues that cause "tail words not selectable / not highlighted".
 *
 * Run:
 *   node scripts/verify-mushaf-alignment.mjs
 *   node scripts/verify-mushaf-alignment.mjs 16        # single page
 *   node scripts/verify-mushaf-alignment.mjs 16 2:105  # single ayah
 */

import { readFileSync, existsSync } from "node:fs";
import { dirname, join, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = resolve(__dirname, "..", "public", "data");
const MIN_W = 10;
const MIN_H = 8;

function loadJson(path) {
  return JSON.parse(readFileSync(path, "utf8"));
}

function main() {
  const pageFilter = process.argv[2] ? Number(process.argv[2]) : null;
  const ayahFilter = process.argv[3] ?? null;

  const idx = loadJson(join(ROOT, "quran", "pages-index.json"));
  const valid = new Set();
  const indexPage = new Map();
  const ayahMap = new Map();

  for (const [page, words] of Object.entries(idx.pages)) {
    for (const w of words) {
      valid.add(w.location);
      indexPage.set(w.location, Number(page));
      const key = `${w.surah}:${w.ayah}`;
      if (!ayahMap.has(key)) ayahMap.set(key, []);
      ayahMap.get(key).push(w.location);
    }
  }
  for (const ids of ayahMap.values()) {
    ids.sort((a, b) => +a.split(":")[2] - +b.split(":")[2]);
  }

  const bboxPage = new Map();
  for (let page = 1; page <= 604; page++) {
    const fp = join(ROOT, "ayahinfo", `page-${String(page).padStart(3, "0")}.json`);
    if (!existsSync(fp)) continue;
    const ai = loadJson(fp);
    for (const w of ai.words) {
      if (!bboxPage.has(w.id)) bboxPage.set(w.id, page);
    }
  }

  const issues = {
    pageMismatch: [],
    missingBbox: [],
    tinyBbox: [],
    tailTiny: [],
    markerTailGap: [],
  };

  for (const [id, ip] of indexPage) {
    if (pageFilter && ip !== pageFilter) continue;
    const [s, a] = id.split(":").slice(0, 2);
    if (ayahFilter && `${s}:${a}` !== ayahFilter) continue;

    const bp = bboxPage.get(id);
    if (!bp) issues.missingBbox.push({ id, indexPage: ip });
    else if (bp !== ip) issues.pageMismatch.push({ id, indexPage: ip, bboxPage: bp });

    if (bp === ip) {
      const ai = loadJson(
        join(ROOT, "ayahinfo", `page-${String(bp).padStart(3, "0")}.json`),
      );
      const box = ai.words.find((w) => w.id === id);
      if (box && (box.w < MIN_W || box.h < MIN_H)) {
        issues.tinyBbox.push({ id, page: bp, w: box.w, h: box.h });
      }
    }
  }

  for (const [key, ids] of ayahMap) {
    if (ayahFilter && key !== ayahFilter) continue;
    const tail = ids.slice(-3);
    for (const id of tail) {
      const ip = indexPage.get(id);
      if (pageFilter && ip !== pageFilter) continue;
      const bp = bboxPage.get(id);
      if (!bp) continue;
      const ai = loadJson(
        join(ROOT, "ayahinfo", `page-${String(bp).padStart(3, "0")}.json`),
      );
      const box = ai.words.find((w) => w.id === id);
      if (!box || box.w < MIN_W || box.h < MIN_H) {
        issues.tailTiny.push({ ayah: key, id, page: bp, box });
      }
    }

    const markerPage = [...tail.map((id) => indexPage.get(id)), indexPage.get(ids.at(-1))].find(Boolean);
    if (!markerPage) continue;
    if (pageFilter && markerPage !== pageFilter) continue;

    const ai = loadJson(
      join(ROOT, "ayahinfo", `page-${String(markerPage).padStart(3, "0")}.json`),
    );
    const decos = ai.words.filter(
      (w) => w.id.startsWith(`${key}:`) && !valid.has(w.id) && w.w >= MIN_W,
    );
    if (decos.length === 0) continue;

    const notRenderable = ids.filter((id) => {
      const p = indexPage.get(id);
      const pageJson = loadJson(
        join(ROOT, "ayahinfo", `page-${String(p).padStart(3, "0")}.json`),
      );
      const box = pageJson.words.find((w) => w.id === id);
      return !box || box.w < MIN_W || box.h < MIN_H;
    });
    if (notRenderable.length > 0) {
      issues.markerTailGap.push({
        ayah: key,
        markerPage,
        totalWords: ids.length,
        notRenderable,
        markerIds: decos.map((d) => d.id),
      });
    }
  }

  console.log("=== Mushaf alignment audit ===\n");
  console.log(`pages-index words: ${valid.size}`);
  console.log(`page mismatch (index page != bbox page): ${issues.pageMismatch.length}`);
  console.log(`missing bbox: ${issues.missingBbox.length}`);
  console.log(`tiny bbox (w<${MIN_W} or h<${MIN_H}): ${issues.tinyBbox.length}`);
  console.log(`tail words with tiny/missing bbox: ${issues.tailTiny.length}`);
  console.log(`ayahs where marker select would miss highlights: ${issues.markerTailGap.length}`);

  const show = (label, rows, n = 15) => {
    if (rows.length === 0) return;
    console.log(`\n--- ${label} (first ${n}) ---`);
    rows.slice(0, n).forEach((r) => console.log(r));
  };

  show("Page mismatches", issues.pageMismatch);
  show("Missing bbox", issues.missingBbox);
  show("Tiny bbox", issues.tinyBbox);
  show("Tail tiny/missing", issues.tailTiny);
  show("Marker tail gaps", issues.markerTailGap);

  if (ayahFilter) {
    const ids = ayahMap.get(ayahFilter) ?? [];
    console.log(`\n--- Ayah ${ayahFilter}: ${ids.length} words ---`);
    console.log("Last 5:", ids.slice(-5).join(", "));
    console.log(
      "Marker tap would return all",
      ids.length,
      "ids; not renderable on their page:",
      issues.markerTailGap.find((g) => g.ayah === ayahFilter)?.notRenderable ?? [],
    );
  }

  const fail =
    issues.missingBbox.length +
    issues.markerTailGap.length +
    issues.pageMismatch.length;
  process.exitCode = fail > 0 ? 1 : 0;
}

main();
