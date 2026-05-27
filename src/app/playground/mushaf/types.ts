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
};

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

export type CountingMode = "per-mark" | "per-range";

export type PaletteSize = 4 | 2;

/** Filter for which categories are visible on the page. "all" shows every category. */
export type CategoryFilter = CategoryId | "all";
