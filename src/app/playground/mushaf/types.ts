/**
 * Types for the Mushaf mistake-marking prototype.
 *
 * Throwaway prototype — these types are intentionally narrow and may diverge
 * from the production schema in Epic 2.
 */

export type CategoryId =
  | "tajweed"
  | "memorization"
  | "pronunciation"
  | "translation";

export type Category = {
  id: CategoryId;
  label: string;
  color: string;
};

export type SubCategory = "misread" | "forgot" | "slipped_corrected";

export type Mark = {
  /** Word id, format "surah:ayah:position" (matches PageWord.location). */
  wordId: string;
  category: CategoryId;
  subCategory?: SubCategory;
  note?: string;
  /**
   * Mistake-group id. All marks sharing a groupId (within one category) are
   * the SAME logical mistake spanning one or more words. A single-word mistake
   * has a group of size 1. Distinct groups = the mistake count.
   */
  groupId: string;
};

/**
 * How a multi-word selection is recorded:
 *  - "one": a drag becomes a single mistake spanning the range (merges words
 *    already marked into one group).
 *  - "separate": a drag becomes one mistake per word.
 */
export type MarkGrouping = "one" | "separate";

/** A read-only marker drawn from the mock previous-session dataset. */
export type HistoricalMark = {
  wordId: string;
  category: CategoryId;
};

export type SessionType =
  | "audit"
  | "memorization"
  | "pronunciation"
  | "translation";

export type RecencyCategory = "new" | "near" | "far";

export type SheetState = "collapsed" | "expanded" | "full";

/**
 * What the headline count measures:
 *  - "per-range": distinct mistake groups (the meaningful "mistakes" count).
 *  - "per-mark": raw marked words (each word counts once per category).
 */
export type CountingMode = "per-mark" | "per-range";

export type PaletteSize = 4 | 2;

/** Filter for which categories are visible on the page. "all" shows every category. */
export type CategoryFilter = CategoryId | "all";
