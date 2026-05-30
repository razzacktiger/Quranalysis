/**
 * Normalizes and repairs Mushaf word bounding boxes exported from ayahinfo.
 *
 * The quran_android glyphs table sometimes stores inverted min/max coordinates
 * (max_x < min_x), yielding zero or negative width. Those boxes fail hit-tests
 * and never render highlights even when marks exist on the word id.
 */

export const MIN_BOX_WIDTH = 10;
export const MIN_BOX_HEIGHT = 8;

export type BBoxWord = {
  id: string;
  line: number;
  x: number;
  y: number;
  w: number;
  h: number;
};

/** Convert raw SQLite min/max columns to a normalized top-left box. */
export function normalizeRawBox(
  minX: number,
  maxX: number,
  minY: number,
  maxY: number,
): Pick<BBoxWord, "x" | "y" | "w" | "h"> {
  return {
    x: Math.min(minX, maxX),
    y: Math.min(minY, maxY),
    w: Math.abs(maxX - minX),
    h: Math.abs(maxY - minY),
  };
}

function isDegenerate(w: number, h: number): boolean {
  return w < MIN_BOX_WIDTH || h < MIN_BOX_HEIGHT;
}

/**
 * Expand tiny boxes on one Mushaf line using horizontal gaps between
 * screen-left-to-right sorted neighbors on that line.
 */
function repairDegenerateLineBoxes(words: BBoxWord[]): void {
  const sorted = [...words].sort((a, b) => a.x - b.x);
  const valid = sorted.filter((w) => !isDegenerate(w.w, w.h));
  const typicalH =
    valid.length > 0
      ? Math.round(valid.reduce((sum, w) => sum + w.h, 0) / valid.length)
      : 72;

  for (let i = 0; i < sorted.length; i++) {
    const box = sorted[i];
    if (!isDegenerate(box.w, box.h)) continue;

    const prev = i > 0 ? sorted[i - 1] : null;
    const next = i < sorted.length - 1 ? sorted[i + 1] : null;

    if (box.w < MIN_BOX_WIDTH) {
      if (prev && next) {
        box.x = prev.x + prev.w + 1;
        box.w = Math.max(MIN_BOX_WIDTH, next.x - box.x - 1);
      } else if (next) {
        box.w = Math.max(MIN_BOX_WIDTH, next.x - box.x - 1);
      } else if (prev) {
        box.x = prev.x + prev.w + 1;
        box.w = Math.max(MIN_BOX_WIDTH, 80);
      } else {
        box.w = Math.max(MIN_BOX_WIDTH, box.w);
      }
      box.w = Math.min(box.w, 140);
    }

    if (box.h < MIN_BOX_HEIGHT) {
      const neighborHeights = [prev, next]
        .filter(
          (n): n is BBoxWord =>
            n != null && n.h >= MIN_BOX_HEIGHT,
        )
        .map((n) => n.h);
      box.h =
        neighborHeights.length > 0
          ? Math.round(
              neighborHeights.reduce((a, b) => a + b, 0) /
                neighborHeights.length,
            )
          : typicalH;
    }
  }
}

/** Normalize and repair all boxes on a Mushaf page (mutates copies). */
export function normalizePageBoxes(words: BBoxWord[]): BBoxWord[] {
  const normalized = words.map((word) => ({ ...word }));
  const byLine = new Map<number, BBoxWord[]>();

  for (const word of normalized) {
    if (!byLine.has(word.line)) byLine.set(word.line, []);
    byLine.get(word.line)!.push(word);
  }

  for (const lineWords of byLine.values()) {
    repairDegenerateLineBoxes(lineWords);
  }

  return normalized;
}
