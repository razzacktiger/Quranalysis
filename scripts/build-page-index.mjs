#!/usr/bin/env node
/**
 * Builds public/data/quran/pages-index.json for the Mushaf prototype.
 *
 * Reads all 114 surah JSONs in public/data/quran/, regroups every word by
 * its `page` (1-604) and writes a single consolidated index keyed by page.
 *
 * Run once locally:
 *   node scripts/build-page-index.mjs
 *
 * Re-run only if the surah JSONs change. The output is committed to git.
 */

import { readFileSync, writeFileSync, readdirSync } from "node:fs";
import { dirname, join, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const DATA_DIR = resolve(__dirname, "..", "public", "data", "quran");

function main() {
  const files = readdirSync(DATA_DIR)
    .filter((f) => /^surah-\d{3}\.json$/.test(f))
    .sort();

  if (files.length !== 114) {
    console.warn(
      `[build-page-index] expected 114 surah files, found ${files.length}`,
    );
  }

  /** @type {Record<number, Array<{ location: string; text: string; surah: number; ayah: number; position: number; line: number }>>} */
  const pages = {};
  /** @type {Record<number, number>} */
  const surahStartPages = {};
  /** @type {Record<number, number>} */
  const surahEndPages = {};

  for (const file of files) {
    const surahData = JSON.parse(readFileSync(join(DATA_DIR, file), "utf8"));
    const surahNumber = surahData.number;
    let minPage = Infinity;
    let maxPage = -Infinity;

    for (const ayah of surahData.ayahs) {
      for (const word of ayah.words) {
        const entry = {
          location: word.location,
          text: word.text,
          surah: surahNumber,
          ayah: ayah.ayah,
          position: word.position,
          line: word.line,
        };
        if (!pages[word.page]) pages[word.page] = [];
        pages[word.page].push(entry);
        if (word.page < minPage) minPage = word.page;
        if (word.page > maxPage) maxPage = word.page;
      }
    }

    surahStartPages[surahNumber] = minPage;
    surahEndPages[surahNumber] = maxPage;
  }

  // Sort each page's words by (surah, ayah, position) for deterministic output
  for (const pageNum of Object.keys(pages)) {
    pages[pageNum].sort((a, b) => {
      if (a.surah !== b.surah) return a.surah - b.surah;
      if (a.ayah !== b.ayah) return a.ayah - b.ayah;
      return a.position - b.position;
    });
  }

  const pageNumbers = Object.keys(pages)
    .map(Number)
    .sort((a, b) => a - b);

  const out = {
    builtAt: new Date().toISOString(),
    pageCount: pageNumbers.length,
    minPage: pageNumbers[0],
    maxPage: pageNumbers[pageNumbers.length - 1],
    surahStartPages,
    surahEndPages,
    pages,
  };

  const outPath = join(DATA_DIR, "pages-index.json");
  writeFileSync(outPath, JSON.stringify(out));
  const sizeKb = (Buffer.byteLength(JSON.stringify(out)) / 1024).toFixed(1);
  console.log(
    `[build-page-index] wrote ${outPath} (${out.pageCount} pages, ${sizeKb} KB)`,
  );
}

main();
