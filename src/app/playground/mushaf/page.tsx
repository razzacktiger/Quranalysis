"use client";

/**
 * Mushaf mistake-marking prototype.
 *
 * Throwaway prototype. Not connected to your account or database.
 * See `docs/SOLO-WORKFLOW.md` and prompt for context.
 */

import { Suspense, useEffect, useMemo, useState } from "react";
import { Amiri_Quran } from "next/font/google";
import { useSearchParams } from "next/navigation";

import { CATEGORIES } from "./samples";
import type {
  CategoryFilter,
  CategoryId,
  CountingMode,
  Mark,
  PaletteSize,
  SessionType,
  SheetState,
} from "./types";
import { getPage, type PageData } from "./data/pageIndex";
import { MushafView } from "./MushafView";
import { BottomSheet } from "./BottomSheet";
import { DebugPanel } from "./DebugPanel";
import { PageNav } from "./PageNav";

const amiriQuran = Amiri_Quran({ subsets: ["arabic"], weight: "400" });

function MushafPlayground() {
  const searchParams = useSearchParams();
  const debugMode = searchParams.get("debug") === "1";

  const [pageNumber, setPageNumber] = useState<number>(1);
  const [page, setPage] = useState<PageData | null>(null);
  const [pageError, setPageError] = useState<string | null>(null);

  const [activeCategory, setActiveCategory] =
    useState<CategoryId>("tajweed");
  const [marks, setMarks] = useState<Mark[]>([]);
  const [history, setHistory] = useState<Mark[][]>([]);
  const [sheetState, setSheetState] = useState<SheetState>("collapsed");
  const [sessionType, setSessionType] = useState<SessionType>("audit");
  const [selfRating, setSelfRating] = useState<number>(7);
  const [historicalMistakes, setHistoricalMistakes] = useState<boolean>(false);

  const [categoryFilter, setCategoryFilter] = useState<CategoryFilter>("all");

  const [paletteSize, setPaletteSize] = useState<PaletteSize>(4);
  const [countingMode, setCountingMode] = useState<CountingMode>("per-mark");

  useEffect(() => {
    let cancelled = false;
    setPageError(null);
    getPage(pageNumber)
      .then((p) => {
        if (!cancelled) setPage(p);
      })
      .catch((err) => {
        if (!cancelled)
          setPageError(err instanceof Error ? err.message : String(err));
      });
    return () => {
      cancelled = true;
    };
  }, [pageNumber]);

  const visibleCategories = useMemo(() => {
    if (paletteSize === 2) {
      return CATEGORIES.filter(
        (c) => c.id === "tajweed" || c.id === "memorization",
      );
    }
    return CATEGORIES;
  }, [paletteSize]);

  if (!visibleCategories.some((c) => c.id === activeCategory)) {
    queueMicrotask(() => setActiveCategory(visibleCategories[0].id));
  }

  const pushHistory = (next: Mark[]) => {
    setHistory((h) => [...h, marks]);
    setMarks(next);
  };

  /**
   * Drag commit: ADD the active category to every dragged word. Idempotent —
   * a word that already has the active category is left alone (no toggle-off
   * on drag, per spec).
   */
  const applyMarksToWordIds = (wordIds: string[]) => {
    if (wordIds.length === 0) return;
    const next = [...marks];
    for (const wid of wordIds) {
      const exists = next.some(
        (m) => m.wordId === wid && m.category === activeCategory,
      );
      if (!exists) next.push({ wordId: wid, category: activeCategory });
    }
    if (next.length === marks.length) return;
    pushHistory(next);
  };

  /**
   * Tap behavior (multi-category aware): toggle the active category on this
   * word. Other categories already on the word are preserved.
   */
  const toggleWord = (wordId: string) => {
    const idx = marks.findIndex(
      (m) => m.wordId === wordId && m.category === activeCategory,
    );
    if (idx >= 0) {
      const next = [...marks];
      next.splice(idx, 1);
      pushHistory(next);
    } else {
      pushHistory([...marks, { wordId, category: activeCategory }]);
    }
  };

  const undo = () => {
    if (history.length === 0) return;
    const prev = history[history.length - 1];
    setHistory((h) => h.slice(0, -1));
    setMarks(prev);
  };

  const clearAll = () => {
    if (marks.length === 0) return;
    pushHistory([]);
  };

  const resetSession = () => {
    setMarks([]);
    setHistory([]);
    setSheetState("collapsed");
  };

  const confirmSession = () => {
    const payload = {
      pageNumber,
      sessionType,
      selfRating,
      historicalMistakes,
      activeCategory,
      paletteSize,
      countingMode,
      markCount: marks.length,
      marks: [...marks].sort((a, b) => compareWordId(a.wordId, b.wordId)),
      timestamp: new Date().toISOString(),
    };
    console.log("[mushaf-prototype] session", payload);
    resetSession();
  };

  return (
    <main
      style={{ backgroundColor: "#fafaf7" }}
      className="min-h-screen w-full pb-32"
    >
      <header className="mx-auto max-w-3xl px-6 pt-8 pb-3">
        <h1 className="text-2xl font-semibold text-stone-800">
          Mushaf Prototype — Playground
        </h1>
        <p className="mt-1 text-sm text-stone-500">
          Throwaway prototype. Not connected to your account or database.
        </p>
        <p className="mt-2 text-xs text-stone-400">
          Arrow keys: ← next page (RTL), → previous page.
        </p>
      </header>

      <PageNav pageNumber={pageNumber} setPageNumber={setPageNumber} />

      <section className="mx-auto max-w-3xl px-4">
        {pageError && (
          <div className="rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-700">
            Failed to load page: {pageError}
          </div>
        )}
        {!page && !pageError && (
          <div className="rounded-lg border border-stone-200 bg-white p-6 text-center text-sm text-stone-500">
            Loading page {pageNumber}…
          </div>
        )}
        {page && (
          <MushafView
            page={page}
            marks={marks}
            activeCategory={activeCategory}
            categoryFilter={categoryFilter}
            categories={CATEGORIES}
            fontClassName={amiriQuran.className}
            onTapWord={toggleWord}
            onCommitDrag={applyMarksToWordIds}
          />
        )}
      </section>

      <BottomSheet
        state={sheetState}
        setState={setSheetState}
        marks={marks}
        categories={CATEGORIES}
        visibleCategories={visibleCategories}
        activeCategory={activeCategory}
        setActiveCategory={setActiveCategory}
        categoryFilter={categoryFilter}
        setCategoryFilter={setCategoryFilter}
        countingMode={countingMode}
        sessionType={sessionType}
        setSessionType={setSessionType}
        selfRating={selfRating}
        setSelfRating={setSelfRating}
        historicalMistakes={historicalMistakes}
        setHistoricalMistakes={setHistoricalMistakes}
        onUndo={undo}
        canUndo={history.length > 0}
        onClearAll={clearAll}
        onConfirm={confirmSession}
      />

      {debugMode && (
        <DebugPanel
          paletteSize={paletteSize}
          setPaletteSize={setPaletteSize}
          countingMode={countingMode}
          setCountingMode={setCountingMode}
        />
      )}
    </main>
  );
}

export default function Page() {
  return (
    <Suspense fallback={null}>
      <MushafPlayground />
    </Suspense>
  );
}

function compareWordId(a: string, b: string): number {
  const pa = a.split(":").map(Number);
  const pb = b.split(":").map(Number);
  for (let i = 0; i < 3; i++) {
    if (pa[i] !== pb[i]) return pa[i] - pb[i];
  }
  return 0;
}
