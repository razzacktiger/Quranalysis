"use client";

/**
 * Runtime loader for the consolidated page index.
 *
 * Approach: single static `/data/quran/pages-index.json` (~7 MB raw,
 * ~2 MB gzipped) is fetched once on mount and cached in module scope.
 * After the first call, all `getPage()` lookups are O(1) and synchronous-
 * feeling (the cache is already populated).
 *
 * Trade-off: ~2 MB initial payload. Fine for a throwaway prototype; a
 * production build would shard by juz or use the CDN image overlay path.
 */

export type PageWord = {
  location: string;
  text: string;
  surah: number;
  ayah: number;
  position: number;
  line: number;
};

export type PageData = {
  pageNumber: number;
  words: PageWord[];
  /** Words grouped by line number, ascending. */
  lines: { lineNumber: number; words: PageWord[] }[];
  /** Distinct surah numbers that contribute words to this page. */
  surahNumbers: number[];
};

type RawIndex = {
  builtAt: string;
  pageCount: number;
  minPage: number;
  maxPage: number;
  surahStartPages: Record<string, number>;
  surahEndPages: Record<string, number>;
  pages: Record<string, PageWord[]>;
};

type SurahMeta = {
  number: number;
  name: string;
  ayahCount: number;
  firstPage: number;
  lastPage: number;
};

let indexPromise: Promise<RawIndex> | null = null;
let surahMetaPromise: Promise<SurahMeta[]> | null = null;

async function loadIndex(): Promise<RawIndex> {
  if (!indexPromise) {
    indexPromise = fetch("/data/quran/pages-index.json").then((r) => {
      if (!r.ok) throw new Error(`pages-index.json fetch failed: ${r.status}`);
      return r.json();
    });
  }
  return indexPromise;
}

async function loadSurahMeta(): Promise<SurahMeta[]> {
  if (!surahMetaPromise) {
    surahMetaPromise = Promise.all([
      loadIndex(),
      fetch("/data/quran/index.json").then((r) => r.json()),
    ]).then(([idx, listing]) => {
      type ListEntry = { number: number; name: string; ayahCount: number };
      const list: ListEntry[] = listing.surahs;
      return list.map((s) => ({
        number: s.number,
        name: s.name,
        ayahCount: s.ayahCount,
        firstPage: idx.surahStartPages[String(s.number)] ?? 1,
        lastPage: idx.surahEndPages[String(s.number)] ?? 604,
      }));
    });
  }
  return surahMetaPromise;
}

/** Fetches everything needed for the page navigator UI. */
export async function getSurahList(): Promise<SurahMeta[]> {
  return loadSurahMeta();
}

/** Returns the {min,max} page numbers covered by the index. */
export async function getPageBounds(): Promise<{ min: number; max: number }> {
  const idx = await loadIndex();
  return { min: idx.minPage, max: idx.maxPage };
}

/** Returns a fully-grouped page payload. */
export async function getPage(pageNumber: number): Promise<PageData> {
  const idx = await loadIndex();
  const raw = idx.pages[String(pageNumber)] ?? [];

  const byLine = new Map<number, PageWord[]>();
  const surahSet = new Set<number>();
  for (const w of raw) {
    surahSet.add(w.surah);
    if (!byLine.has(w.line)) byLine.set(w.line, []);
    byLine.get(w.line)!.push(w);
  }

  const lines = [...byLine.entries()]
    .sort((a, b) => a[0] - b[0])
    .map(([lineNumber, words]) => ({ lineNumber, words }));

  return {
    pageNumber,
    words: raw,
    lines,
    surahNumbers: [...surahSet].sort((a, b) => a - b),
  };
}

/** Synchronous Arabic-Indic numerals helper. */
export function toArabicNumerals(n: number): string {
  return n.toLocaleString("ar-EG", { useGrouping: false });
}
