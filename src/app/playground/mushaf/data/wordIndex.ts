"use client";

import {
  isRubMarkId,
  isTinyWaqfBox,
  isWaqfMarkId,
  rubMarkBaseId,
  waqfMarkBaseId,
} from "./alignPageBoxes";

/**
 * Word-index loader for distinguishing real Quranic words from decorative
 * Mushaf glyphs (ayah-end markers, rub-el-hizb / quarter-hizb symbols, etc.).
 *
 * Two decoration sources:
 *  1. Bbox-only glyphs in ayahinfo that are NOT in pages-index — split into:
 *     - **Waqf / pause marks** (ج, صلى, قلى, meem, etc.) — markable alone, never
 *       expand to a full ayah and never shift real-word indices.
 *     - **Ayah-end markers** ((١٠٥), etc.) — tap expands to the whole ayah.
 *  2. Structural symbols MERGED into the first word of an ayah in pages-index
 *     — e.g. `2:106:1` has text `"۞ مَا"`. The ۞ shares the word bbox.
 *     Tapping the symbol zone selects the whole ayah; marks never paint over ۞.
 */

/** Arabic rub el hizb / quarter-hizb marker (U+06DE). ~199 ayah starts. */
export const RUB_EL_HIZB = "\u06DE";

/** Fraction of a rub-el-hizb word box (RTL right edge) occupied by ۞. */
export const RUB_SYMBOL_WIDTH_FRACTION = 0.52;

type PageWord = {
  location: string;
  text: string;
  surah: number;
  ayah: number;
  position: number;
};

type RawIndex = {
  pages: Record<string, PageWord[]>;
};

type BBoxLike = { id: string; x: number; y: number; w: number; h: number };

let initPromise: Promise<void> | null = null;
let indexReady = false;
let validWords: Set<string> | null = null;
let wordTextMap: Map<string, string> | null = null;
let rubElHizbStarts: Set<string> | null = null;
/** Key: "surah:ayah" → sorted word locations. */
let ayahWordMap: Map<string, string[]> | null = null;
/** Key: "surah:ayah" → highest recitable word position in pages-index. */
let ayahMaxPosition: Map<string, number> | null = null;

/** Heuristic thresholds for classifying bbox-only glyphs (1260px mushaf). */
export const WAQF_MAX_AREA = 4000;
export const WAQF_MAX_W = 40;
export const WAQF_MAX_H = 45;
export const AYAH_END_MIN_W = 70;

export type DecorationKind = "waqf" | "ayah-end";

function compareWordId(a: string, b: string): number {
  const pa = a.split(":").map(Number);
  const pb = b.split(":").map(Number);
  for (let i = 0; i < 3; i++) {
    if (pa[i] !== pb[i]) return pa[i] - pb[i];
  }
  return 0;
}

function textStartsWithRub(text: string): boolean {
  return text.trimStart().startsWith(RUB_EL_HIZB);
}

/** Loads and caches the word index (once per session). */
export async function initWordIndex(): Promise<void> {
  if (indexReady) return;
  if (!initPromise) {
    initPromise = fetch("/data/quran/pages-index.json")
      .then((r) => {
        if (!r.ok) throw new Error(`pages-index.json: ${r.status}`);
        return r.json() as Promise<RawIndex>;
      })
      .then((idx) => {
        const valid = new Set<string>();
        const texts = new Map<string, string>();
        const rubStarts = new Set<string>();
        const ayahMap = new Map<string, string[]>();
        const maxPos = new Map<string, number>();
        for (const words of Object.values(idx.pages)) {
          for (const w of words) {
            valid.add(w.location);
            texts.set(w.location, w.text);
            if (w.position === 1 && textStartsWithRub(w.text)) {
              rubStarts.add(w.location);
            }
            const key = `${w.surah}:${w.ayah}`;
            if (!ayahMap.has(key)) ayahMap.set(key, []);
            ayahMap.get(key)!.push(w.location);
            maxPos.set(key, Math.max(maxPos.get(key) ?? 0, w.position));
          }
        }
        for (const ids of ayahMap.values()) {
          ids.sort(compareWordId);
        }
        validWords = valid;
        wordTextMap = texts;
        rubElHizbStarts = rubStarts;
        ayahWordMap = ayahMap;
        ayahMaxPosition = maxPos;
        indexReady = true;
      });
  }
  await initPromise;
}

export function isWordIndexReady(): boolean {
  return indexReady;
}

/** True when the id is a real recitable word (not a bbox-only decoration). */
export function isRealWord(wordId: string): boolean {
  if (!validWords) return false;
  return validWords.has(wordId);
}

/**
 * Classify a bbox-only glyph (not in pages-index).
 * Small superscript boxes are waqf/pause marks; wide glyphs after the last
 * real word are ayah-end markers.
 */
export function classifyDecorationGlyph(
  wordId: string,
  box: { w: number; h: number },
): DecorationKind {
  const parts = wordId.split(":");
  if (parts.length !== 3) return "waqf";
  const key = `${parts[0]}:${parts[1]}`;
  const pos = Number(parts[2]);
  const maxReal = ayahMaxPosition?.get(key) ?? pos;
  const area = box.w * box.h;

  if (pos > maxReal && box.w >= AYAH_END_MIN_W) return "ayah-end";
  if (
    area <= WAQF_MAX_AREA ||
    (box.w <= WAQF_MAX_W && box.h <= WAQF_MAX_H)
  ) {
    return "waqf";
  }
  if (pos > maxReal) return "ayah-end";
  return "waqf";
}

/** True for waqf / pause / sajdah overlay glyphs (markable, not a recited word). */
export function isWaqfGlyph(
  wordId: string,
  box: { w: number; h: number },
): boolean {
  if (isRealWord(wordId)) return false;
  if (isWaqfMarkId(wordId)) return true;
  if (isTinyWaqfBox(box)) return true;
  return classifyDecorationGlyph(wordId, box) === "waqf";
}

/** Label for popover / summary when a pause-mark glyph is marked. */
export function getMarkableGlyphLabel(wordId: string): string {
  if (isRubMarkId(wordId)) {
    return `Rub el hizb (۞) — ${rubMarkBaseId(wordId)}`;
  }
  if (isWaqfMarkId(wordId)) {
    return `Pause mark (${waqfMarkBaseId(wordId)})`;
  }
  return "Pause mark";
}

/** True when this word's box begins with a rub-el-hizb ۞ symbol. */
export function isRubElHizbStart(wordId: string): boolean {
  if (!rubElHizbStarts) return false;
  return rubElHizbStarts.has(wordId);
}

/** Uthmani text for a word location. */
export function getWordText(wordId: string): string {
  return wordTextMap?.get(wordId) ?? "";
}

/** Recitable text only — strips leading ۞ for display in popovers etc. */
export function getDisplayWordText(wordId: string): string {
  const raw = getWordText(wordId);
  return raw.replace(/^\u06DE\s*/, "").trim();
}

/** Minimum hit-test size — end-of-line words can be <12px wide in ayahinfo. */
export const MIN_HIT_WIDTH = 24;
export const MIN_HIT_HEIGHT = 24;

/** Expand tiny boxes for pointer hit-testing only (not for highlight paint). */
export function hitTestBox(box: {
  x: number;
  y: number;
  w: number;
  h: number;
}): { x: number; y: number; w: number; h: number } {
  let { x, y, w, h } = box;
  if (w <= 0 || h <= 0) return { x, y, w, h };
  if (w < MIN_HIT_WIDTH) {
    const pad = (MIN_HIT_WIDTH - w) / 2;
    x -= pad;
    w = MIN_HIT_WIDTH;
  }
  if (h < MIN_HIT_HEIGHT) {
    const pad = (MIN_HIT_HEIGHT - h) / 2;
    y -= pad;
    h = MIN_HIT_HEIGHT;
  }
  return { x, y, w, h };
}

export function pointInBox(
  box: { x: number; y: number; w: number; h: number },
  sx: number,
  sy: number,
): boolean {
  const hit = hitTestBox(box);
  return (
    hit.w > 0 &&
    hit.h > 0 &&
    sx >= hit.x &&
    sx <= hit.x + hit.w &&
    sy >= hit.y &&
    sy <= hit.y + hit.h
  );
}

/** True when a word box overlaps an axis-aligned drag rectangle. */
export function boxIntersectsRect(
  box: { x: number; y: number; w: number; h: number },
  rx1: number,
  ry1: number,
  rx2: number,
  ry2: number,
): boolean {
  if (box.w <= 0 || box.h <= 0) return false;
  const x1 = Math.min(rx1, rx2);
  const x2 = Math.max(rx1, rx2);
  const y1 = Math.min(ry1, ry2);
  const y2 = Math.max(ry1, ry2);
  return (
    box.x + box.w >= x1 &&
    box.x <= x2 &&
    box.y + box.h >= y1 &&
    box.y <= y2
  );
}

/**
 * When a drag selects words 20 and 22 of an ayah, also include 21.
 * Prevents "almost full ayah" gaps from pointer-path misses.
 */
export function fillAyahPositionGaps(
  selected: Iterable<string>,
  pageWordIds: Iterable<string>,
): string[] {
  const chosen = new Set(selected);
  const byAyah = new Map<string, number[]>();

  for (const id of chosen) {
    const parts = id.split(":");
    if (parts.length !== 3) continue;
    const key = `${parts[0]}:${parts[1]}`;
    if (!byAyah.has(key)) byAyah.set(key, []);
    byAyah.get(key)!.push(Number(parts[2]));
  }

  for (const [key, positions] of byAyah) {
    const minP = Math.min(...positions);
    const maxP = Math.max(...positions);
    for (const id of pageWordIds) {
      if (!validWords?.has(id)) continue;
      const parts = id.split(":");
      if (parts.length !== 3) continue;
      if (`${parts[0]}:${parts[1]}` !== key) continue;
      const p = Number(parts[2]);
      if (p >= minP && p <= maxP) chosen.add(id);
    }
  }

  return Array.from(chosen).sort(compareWordId);
}

/**
 * True when sx falls on the ۞ portion of a rub-el-hizb word box (RTL right).
 */
export function isTapInRubSymbolZone(
  box: { x: number; w: number },
  sx: number,
): boolean {
  const symbolLeft = box.x + box.w * (1 - RUB_SYMBOL_WIDTH_FRACTION);
  return sx >= symbolLeft && sx <= box.x + box.w;
}

/** All real word ids for an ayah. */
export function getAyahWordIds(surah: number, ayah: number): string[] {
  return ayahWordMap?.get(`${surah}:${ayah}`) ?? [];
}

/**
 * Resolve a screen point against all page boxes to markable word ids.
 *
 * Priority:
 *  1. Rub-el-hizb symbol zone → entire ayah
 *  2. Real word (smallest box) — wins over overlapping waqf marks
 *  3. Waqf / pause mark → that glyph only (markable, no index shift)
 *  4. Ayah-end marker → entire ayah
 */
export function resolvePointHit(
  boxes: BBoxLike[],
  sx: number,
  sy: number,
): string[] {
  if (!indexReady || !validWords || !ayahWordMap) return [];

  const hits = boxes.filter((w) => pointInBox(w, sx, sy));
  if (hits.length === 0) return [];

  // 1) Rub el hizb (۞) — separate box after align split, or legacy combined zone.
  for (const w of hits) {
    if (isRubMarkId(w.id)) {
      const base = rubMarkBaseId(w.id);
      const [surah, ayah] = base.split(":").map(Number);
      return getAyahWordIds(surah, ayah);
    }
  }
  for (const w of hits) {
    if (isRubElHizbStart(w.id) && isTapInRubSymbolZone(w, sx)) {
      const [surah, ayah] = w.id.split(":").map(Number);
      return getAyahWordIds(surah, ayah);
    }
  }

  // 2) Real word — smallest overlapping box wins (including over waqf marks).
  const realHits = hits.filter((w) => validWords!.has(w.id));
  if (realHits.length > 0) {
    const pick = realHits.reduce((best, w) =>
      w.w * w.h < best.w * best.h ? w : best,
    );
    return [pick.id];
  }

  const decoHits = hits.filter((w) => !validWords!.has(w.id));
  if (decoHits.length === 0) return [];

  const waqfHits = decoHits.filter((w) => isWaqfGlyph(w.id, w));
  if (waqfHits.length > 0) {
    const pick = waqfHits.reduce((best, w) =>
      w.w * w.h < best.w * best.h ? w : best,
    );
    return [pick.id];
  }

  // 4) Ayah-end marker → whole ayah.
  const pick = decoHits.reduce((best, w) =>
    w.w * w.h < best.w * best.h ? w : best,
  );
  const [surah, ayah] = pick.id.split(":").map(Number);
  return getAyahWordIds(surah, ayah);
}
