/**
 * Shared static config for the Mushaf prototype.
 *
 * The "passage" concept is gone — words now come from the page-index loader
 * in ./data/pageIndex.ts. This module keeps the small static config that
 * isn't user-supplied or page-derived (category colors, mock historical
 * mistakes, etc.).
 */

import type { Category, HistoricalMark } from "./types";

export const CATEGORIES: Category[] = [
  { id: "tajweed", label: "Tajweed", color: "#EF4444" },
  { id: "memorization", label: "Memorization", color: "#F59E0B" },
  { id: "pronunciation", label: "Pronunciation", color: "#8B5CF6" },
  { id: "translation", label: "Translation", color: "#10B981" },
];

/**
 * Fixed display order for stacked color stripes under marked words.
 * Reason: keeping the order deterministic prevents the stripe stack from
 * shifting visually as the user adds/removes categories.
 */
export const STRIPE_ORDER: Category["id"][] = [
  "tajweed",
  "memorization",
  "pronunciation",
  "translation",
];

/**
 * Mock "previous session" marks for the Historical Mistakes overlay.
 *
 * Hand-picked deterministic words across familiar pages (Al-Fatiha on
 * page 1, Ayatul Kursi on page 42) so the demo always shows something
 * recognisable when the toggle flips on. Read-only in the prototype.
 */
export const MOCK_HISTORICAL_MARKS: HistoricalMark[] = [
  { wordId: "1:1:2", category: "tajweed" },
  { wordId: "1:1:3", category: "memorization" },
  { wordId: "1:2:1", category: "pronunciation" },
  { wordId: "1:5:2", category: "tajweed" },
  { wordId: "1:7:6", category: "memorization" },
  { wordId: "2:255:1", category: "tajweed" },
  { wordId: "2:255:7", category: "memorization" },
  { wordId: "2:255:24", category: "pronunciation" },
  { wordId: "2:255:42", category: "translation" },
  { wordId: "2:255:50", category: "tajweed" },
];
