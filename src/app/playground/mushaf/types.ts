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

export type Word = {
  /** "surah:ayah:position" e.g. "1:1:3". Matches the mobile app's convention. */
  id: string;
  text: string;
  ayah: number;
  position: number;
};

export type Ayah = {
  number: number;
  words: Word[];
};

export type Passage = {
  id: string;
  surahNumber: number;
  surahNameArabic: string;
  surahNameEnglish: string;
  ayahs: Ayah[];
};

export type Mark = {
  /** Word id this mark applies to. */
  wordId: string;
  category: CategoryId;
};

export type SessionType =
  | "audit"
  | "memorization"
  | "pronunciation"
  | "translation";

export type SheetState = "collapsed" | "expanded" | "full";

export type CountingMode = "per-mark" | "per-range";

export type PaletteSize = 4 | 2;
