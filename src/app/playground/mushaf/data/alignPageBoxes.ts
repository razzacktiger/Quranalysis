/**
 * Aligns pages-index word ids with ayahinfo bounding boxes by reading order.
 *
 * quran.com (pages-index) merges waqf symbols into word text (e.g. `"رَيْبَ ۛ"`),
 * while quran_android (ayahinfo) splits them into separate tiny glyph positions
 * at the SAME position ids. Using ids naively maps `"2:2:5"` → three-dot bbox
 * instead of `"فِيهِ"`.
 *
 * Fix: per ayah line, pair index words (by position) with non-tiny visual boxes
 * in RTL order (ignore ayahinfo box ids — they can name a different glyph on
 * another line). Extra boxes on the line are union-merged into the last index
 * word. Split-symbol boxes get a `waqf:` id prefix so they never collide.
 */

import type { PageWord } from "./pageIndex";
import type { BBoxWord } from "./normalizeBoxes";

/** Same thresholds as wordIndex — tiny split-symbol glyphs. */
const WAQF_MAX_W = 40;
const WAQF_MAX_H = 45;

export const WAQF_ID_PREFIX = "waqf:";

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

      const lineBoxes = ayahBoxes
        .filter(
          (b) =>
            b.line === lineNum &&
            !isTinyWaqfBox(b) &&
            !usedKeys.has(boxKey(b)),
        )
        .sort((a, b) => b.x - a.x);

      const n = Math.min(lineWords.length, lineBoxes.length);
      for (let i = 0; i < n; i++) {
        const iw = lineWords[i];
        const box = lineBoxes[i];
        usedKeys.add(boxKey(box));
        result.push({
          ...box,
          id: iw.location,
          line: iw.line,
        });
      }

      if (n > 0 && lineBoxes.length > n) {
        const lastLoc = lineWords[n - 1].location;
        const leftovers = lineBoxes.slice(n);
        for (const box of leftovers) usedKeys.add(boxKey(box));

        const tailDeco: BBoxWord[] = [];
        const tailMerge: BBoxWord[] = [];
        for (const box of leftovers) {
          if (!indexLocs.has(box.id)) tailDeco.push(box);
          else tailMerge.push(box);
        }

        if (tailMerge.length > 0) {
          const idx = result.findIndex(
            (r) => r.id === lastLoc && r.line === lineNum,
          );
          if (idx >= 0) {
            const merged = unionBoxes([result[idx], ...tailMerge]);
            result[idx] = { ...result[idx], ...merged };
          }
        }
        for (const box of tailDeco) result.push(box);
      } else if (n === 0) {
        for (const box of lineBoxes) {
          if (indexLocs.has(box.id)) continue;
          usedKeys.add(boxKey(box));
          result.push(box);
        }
      }
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

  return result;
}
