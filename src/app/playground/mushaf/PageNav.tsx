"use client";

/**
 * Page navigation header for the Mushaf prototype.
 *
 *   ← prev | [page picker] [surah jump] | next →
 *
 * Keyboard binding (only active when no input/textarea/select has focus):
 *   ArrowLeft   → next page (RTL reading order — pages turn leftwards)
 *   ArrowRight  → previous page
 *
 * Surah dropdown is loaded async from /data/quran/index.json via the
 * page-index loader. While it's loading, the dropdown shows a single
 * placeholder option.
 */

import { useEffect, useMemo, useState } from "react";
import { getPageBounds, getSurahList, toArabicNumerals } from "./data/pageIndex";

type Props = {
  pageNumber: number;
  setPageNumber: (n: number) => void;
};

type SurahMeta = {
  number: number;
  name: string;
  ayahCount: number;
  firstPage: number;
  lastPage: number;
};

export function PageNav({ pageNumber, setPageNumber }: Props) {
  const [bounds, setBounds] = useState<{ min: number; max: number }>({
    min: 1,
    max: 604,
  });
  const [surahs, setSurahs] = useState<SurahMeta[] | null>(null);

  useEffect(() => {
    getPageBounds().then(setBounds).catch(() => {});
    getSurahList().then(setSurahs).catch(() => {});
  }, []);

  useEffect(() => {
    const isTextEditing = (el: Element | null): boolean => {
      if (!el) return false;
      const tag = el.tagName;
      if (tag === "INPUT" || tag === "TEXTAREA" || tag === "SELECT") return true;
      if ((el as HTMLElement).isContentEditable) return true;
      return false;
    };

    const onKey = (e: KeyboardEvent) => {
      if (isTextEditing(document.activeElement)) return;
      if (e.key === "ArrowLeft") {
        e.preventDefault();
        setPageNumber(Math.min(bounds.max, pageNumber + 1));
      } else if (e.key === "ArrowRight") {
        e.preventDefault();
        setPageNumber(Math.max(bounds.min, pageNumber - 1));
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [pageNumber, bounds, setPageNumber]);

  const pageOptions = useMemo(() => {
    const arr: number[] = [];
    for (let p = bounds.min; p <= bounds.max; p++) arr.push(p);
    return arr;
  }, [bounds]);

  const currentSurah = useMemo(() => {
    if (!surahs) return null;
    return (
      surahs.find(
        (s) => s.firstPage <= pageNumber && pageNumber <= s.lastPage,
      ) ?? null
    );
  }, [surahs, pageNumber]);

  const canPrev = pageNumber > bounds.min;
  const canNext = pageNumber < bounds.max;

  return (
    <div className="mx-auto flex max-w-3xl flex-wrap items-center gap-3 px-6 pb-3">
      <button
        type="button"
        onClick={() => canPrev && setPageNumber(pageNumber - 1)}
        disabled={!canPrev}
        aria-label="Previous page"
        className="rounded-lg border border-stone-200 bg-white px-3 py-1.5 text-sm text-stone-700 hover:bg-stone-50 disabled:opacity-30"
      >
        ← Prev
      </button>

      <div className="flex items-center gap-2 text-sm text-stone-700">
        <span className="text-stone-500">Page</span>
        <select
          value={pageNumber}
          onChange={(e) => setPageNumber(Number(e.target.value))}
          aria-label="Jump to page"
          className="rounded-md border border-stone-200 bg-white px-2 py-1 text-sm"
        >
          {pageOptions.map((p) => (
            <option key={p} value={p}>
              {p} ({toArabicNumerals(p)})
            </option>
          ))}
        </select>
      </div>

      <div className="flex items-center gap-2 text-sm text-stone-700">
        <span className="text-stone-500">Surah</span>
        <select
          value={currentSurah?.number ?? ""}
          onChange={(e) => {
            const s = surahs?.find((x) => x.number === Number(e.target.value));
            if (s) setPageNumber(s.firstPage);
          }}
          aria-label="Jump to start of surah"
          className="min-w-[180px] rounded-md border border-stone-200 bg-white px-2 py-1 text-sm"
          disabled={!surahs}
        >
          {!surahs && <option value="">Loading…</option>}
          {surahs?.map((s) => (
            <option key={s.number} value={s.number}>
              {s.number}. {s.name}
            </option>
          ))}
        </select>
      </div>

      <button
        type="button"
        onClick={() => canNext && setPageNumber(pageNumber + 1)}
        disabled={!canNext}
        aria-label="Next page"
        className="ml-auto rounded-lg border border-stone-200 bg-white px-3 py-1.5 text-sm text-stone-700 hover:bg-stone-50 disabled:opacity-30"
      >
        Next →
      </button>
    </div>
  );
}
