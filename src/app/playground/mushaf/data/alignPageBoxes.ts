/**
 * Aligns pages-index word ids with ayahinfo bounding boxes by reading order.
 *
 * quran.com (pages-index) merges waqf symbols into word text (e.g. `"رَيْبَ ۛ"`),
 * while quran_android (ayahinfo) splits them into separate tiny glyph positions
 * at the SAME position ids. Using ids naively maps `"2:2:5"` → three-dot bbox
 * instead of `"فِيهِ"`.
 *
 * Fix: per ayah line, walk boxes RTL and merge only gap-0 glyphs that share the
 * same ayah position id as the index word (split diacritics). Gap-0 with a
 * different position (e.g. `2:106:10` + `2:106:11`) starts the next word.
 * Rub `"۞ مَا"` entries are split into `rub:` + word boxes. Waqf → `waqf:` prefix.
 */

import type { PageWord } from "./pageIndex";
import type { BBoxWord } from "./normalizeBoxes";

/** Same thresholds as wordIndex — tiny split-symbol glyphs. */
const WAQF_MAX_W = 40;
const WAQF_MAX_H = 45;

export const WAQF_ID_PREFIX = "waqf:";

/** Synthetic id for the ۞ (rub el hizb) zone split from a merged index word box. */
export const RUB_ID_PREFIX = "rub:";

const RUB_EL_HIZB = "\u06DE";

/** Fraction of a combined rub+word ayahinfo box occupied by ۞ (RTL right edge). */
const RUB_SYMBOL_WIDTH_FRACTION = 0.52;

export function isTinyWaqfBox(box: { w: number; h: number }): boolean {
  return (
    box.w > 0 &&
    box.h > 0 &&
    (box.w <= WAQF_MAX_W && box.h <= WAQF_MAX_H)
  );
}

export function isWaqfMarkId(wordId: string): boolean {
  return wordId.startsWith(WAQF_ID_PREFIX);
}

export function isRubMarkId(wordId: string): boolean {
  return wordId.startsWith(RUB_ID_PREFIX);
}

/** Location id under a `rub:` synthetic box (e.g. `rub:2:106:1` → `2:106:1`). */
export function rubMarkBaseId(wordId: string): string {
  return isRubMarkId(wordId) ? wordId.slice(RUB_ID_PREFIX.length) : wordId;
}

/** Strip `waqf:` prefix to show underlying glyph location in debug UI. */
export function waqfMarkBaseId(wordId: string): string {
  return isWaqfMarkId(wordId) ? wordId.slice(WAQF_ID_PREFIX.length) : wordId;
}

function ayahKeyFromId(id: string): string | null {
  const parts = id.split(":");
  if (parts.length !== 3) return null;
  return `${parts[0]}:${parts[1]}`;
}

function boxKey(box: BBoxWord): string {
  return `${box.id}:${box.x}:${box.y}:${box.w}`;
}

/** Union of one or more boxes (e.g. split glyphs merged into one index word). */
function unionBoxes(
  boxes: Array<Pick<BBoxWord, "x" | "y" | "w" | "h">>,
): Pick<BBoxWord, "x" | "y" | "w" | "h"> {
  let x1 = Infinity;
  let y1 = Infinity;
  let x2 = -Infinity;
  let y2 = -Infinity;
  for (const b of boxes) {
    if (b.w <= 0 || b.h <= 0) continue;
    x1 = Math.min(x1, b.x);
    y1 = Math.min(y1, b.y);
    x2 = Math.max(x2, b.x + b.w);
    y2 = Math.max(y2, b.y + b.h);
  }
  if (!Number.isFinite(x1)) return { x: 0, y: 0, w: 0, h: 0 };
  return { x: x1, y: y1, w: x2 - x1, h: y2 - y1 };
}

/** Horizontal gap between two boxes on the same line (RTL: prev is farther right). */
function horizontalGap(prev: BBoxWord, next: BBoxWord): number {
  return prev.x - (next.x + next.w);
}

function idPosition(id: string): number | null {
  const parts = id.split(":");
  if (parts.length !== 3) return null;
  const pos = Number(parts[2]);
  return Number.isFinite(pos) ? pos : null;
}

function textStartsWithRub(text: string): boolean {
  return text.trimStart().startsWith(RUB_EL_HIZB);
}

/**
 * Split one combined ayahinfo box into ۞ (rub) + recitable text zones for
 * pages-index entries like `"۞ مَا"`.
 */
function splitRubElHizbWordBox(box: BBoxWord): BBoxWord[] {
  const rubW = Math.round(box.w * RUB_SYMBOL_WIDTH_FRACTION);
  const textW = box.w - rubW;
  if (rubW < 4 || textW < 4) return [box];

  return [
    {
      ...box,
      w: textW,
    },
    {
      id: `${RUB_ID_PREFIX}${box.id}`,
      line: box.line,
      x: box.x + textW,
      y: box.y,
      w: rubW,
      h: box.h,
    },
  ];
}

/** After line assignment, split rub-el-hizb starts into separate hit targets. */
function applyRubSplits(
  result: BBoxWord[],
  indexWords: PageWord[],
): BBoxWord[] {
  const rubLocs = new Set(
    indexWords.filter((w) => textStartsWithRub(w.text)).map((w) => w.location),
  );
  const out: BBoxWord[] = [];
  for (const box of result) {
    if (rubLocs.has(box.id) && !isRubMarkId(box.id)) {
      out.push(...splitRubElHizbWordBox(box));
    } else {
      out.push(box);
    }
  }
  return out;
}

/**
 * Touching next box uses the following android position id but belongs to the
 * current index word (split glyph), e.g. `2:106:11` glued to `2:106:10`.
 */
function isSplitGlyphOfWord(nextPos: number | null, wordPos: number): boolean {
  return nextPos !== null && nextPos === wordPos + 1;
}

/**
 * Assign index words to ayahinfo boxes on one line (RTL).
 * Walk all boxes in order; merge gap-0 same position and position+1 split glyphs.
 * Line-end homonym ids replace the last word's geometry (not union with wrong slice).
 */
function assignLineWordsRTL(
  lineWords: PageWord[],
  lineBoxes: BBoxWord[],
  lineNum: number,
  indexLocs: Set<string>,
  usedKeys: Set<string>,
  result: BBoxWord[],
): void {
  const sorted = [...lineBoxes].sort((a, b) => b.x - a.x);
  const assigned = new Map<string, BBoxWord[]>();
  let bi = 0;
  let lastWordIdx = -1;

  for (let wi = 0; wi < lineWords.length; wi++) {
    if (bi >= sorted.length) break;

    const iw = lineWords[wi];
    const wordPos = iw.position;
    const cluster: BBoxWord[] = [sorted[bi]];
    bi++;
    while (bi < sorted.length) {
      const gap = horizontalGap(cluster[cluster.length - 1], sorted[bi]);
      if (gap > 0) break;
      const nextPos = idPosition(sorted[bi].id);
      if (nextPos !== null && nextPos < wordPos) break;
      if (nextPos === wordPos || isSplitGlyphOfWord(nextPos, wordPos)) {
        cluster.push(sorted[bi]);
        bi++;
        continue;
      }
      break;
    }

    for (const box of cluster) usedKeys.add(boxKey(box));
    assigned.set(iw.location, cluster);
    lastWordIdx = wi;
  }

  if (bi < sorted.length && lastWordIdx >= 0) {
    const lastIw = lineWords[lastWordIdx];
    const homonymTail = sorted.slice(bi).filter((b) => {
      if (!indexLocs.has(b.id)) return false;
      const pos = idPosition(b.id);
      return pos !== null && pos !== lastIw.position;
    });
    if (homonymTail.length > 0) {
      for (const b of homonymTail) usedKeys.add(boxKey(b));
      assigned.set(lastIw.location, homonymTail);
      bi = sorted.length;
    }
  }

  for (const w of lineWords) {
    const cluster = assigned.get(w.location);
    if (!cluster?.length) continue;
    result.push({
      ...unionBoxes(cluster),
      id: w.location,
      line: lineNum,
    });
  }

  for (; bi < sorted.length; bi++) {
    const box = sorted[bi];
    if (indexLocs.has(box.id)) continue;
    usedKeys.add(boxKey(box));
    result.push(box);
  }
}

/**
 * Remap raw ayahinfo boxes so each pages-index word id sits on the correct
 * visual glyph. Returns the merged list used for hit-testing and highlights.
 */
export function alignPageWordBoxes(
  indexWords: PageWord[],
  rawBoxes: BBoxWord[],
): BBoxWord[] {
  if (indexWords.length === 0) return rawBoxes;

  const indexLocs = new Set(indexWords.map((w) => w.location));
  const usedKeys = new Set<string>();
  const result: BBoxWord[] = [];

  const ayahGroups = new Map<string, PageWord[]>();
  for (const w of indexWords) {
    const key = `${w.surah}:${w.ayah}`;
    if (!ayahGroups.has(key)) ayahGroups.set(key, []);
    ayahGroups.get(key)!.push(w);
  }

  for (const [ayahKey, words] of ayahGroups) {
    words.sort((a, b) => a.position - b.position);
    const prefix = `${ayahKey}:`;
    const ayahBoxes = rawBoxes.filter((b) => b.id.startsWith(prefix));

    // Split-symbol glyphs that share an index id → `waqf:` ids.
    for (const box of ayahBoxes) {
      if (!isTinyWaqfBox(box)) continue;
      const id = indexLocs.has(box.id) ? `${WAQF_ID_PREFIX}${box.id}` : box.id;
      result.push({ ...box, id });
      usedKeys.add(boxKey(box));
    }

    const lineGroups = new Map<number, PageWord[]>();
    for (const w of words) {
      if (!lineGroups.has(w.line)) lineGroups.set(w.line, []);
      lineGroups.get(w.line)!.push(w);
    }

    for (const [, lineWords] of [...lineGroups.entries()].sort(
      (a, b) => a[0] - b[0],
    )) {
      lineWords.sort((a, b) => a.position - b.position);
      const lineNum = lineWords[0].line;

      const lineBoxes = ayahBoxes.filter(
        (b) =>
          b.line === lineNum &&
          !isTinyWaqfBox(b) &&
          !usedKeys.has(boxKey(b)),
      );

      assignLineWordsRTL(
        lineWords,
        lineBoxes,
        lineNum,
        indexLocs,
        usedKeys,
        result,
      );
    }

    // Fallback: direct id lookup when line pairing missed a word.
    for (const w of words) {
      if (result.some((r) => r.id === w.location)) continue;
      const direct = ayahBoxes.find((b) => b.id === w.location);
      if (direct && !isTinyWaqfBox(direct) && !usedKeys.has(boxKey(direct))) {
        usedKeys.add(boxKey(direct));
        result.push(direct);
      }
    }
  }

  // Remaining non-index decorations (ayah markers etc.) on this page.
  for (const box of rawBoxes) {
    if (usedKeys.has(boxKey(box))) continue;
    const key = ayahKeyFromId(box.id);
    if (!key || !ayahGroups.has(key)) continue;
    if (indexLocs.has(box.id) && !isTinyWaqfBox(box)) continue;
    if (indexLocs.has(box.id) && isTinyWaqfBox(box)) continue;
    result.push(box);
    usedKeys.add(boxKey(box));
  }

  return applyRubSplits(result, indexWords);
}
