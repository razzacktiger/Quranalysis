"use client";

/**
 * Mushaf mistake-marking prototype.
 *
 * Throwaway prototype. Not connected to your account or database.
 * See `docs/SOLO-WORKFLOW.md` and prompt for context.
 */

import { Suspense, useEffect, useMemo, useState } from "react";
import { useSearchParams } from "next/navigation";

import { CATEGORIES, MOCK_HISTORICAL_MARKS } from "./samples";
import type {
  CategoryFilter,
  CategoryId,
  CountingMode,
  Mark,
  PaletteSize,
  RecencyCategory,
  SessionType,
  SheetState,
} from "./types";
import { getPage, type PageData } from "./data/pageIndex";
import { MushafPageView } from "./MushafPageView";
import { BottomSheet } from "./BottomSheet";
import { DebugPanel } from "./DebugPanel";
import { PageNav } from "./PageNav";
import { WordPopover } from "./WordPopover";
import type { SubCategory } from "./types";

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

  const [durationMinutes, setDurationMinutes] = useState<string>("");
  const [timerRunning, setTimerRunning] = useState<boolean>(false);
  const [timerElapsedSec, setTimerElapsedSec] = useState<number>(0);
  const [recency, setRecency] = useState<RecencyCategory>("new");
  const [notes, setNotes] = useState<string>("");

  const [categoryFilter, setCategoryFilter] = useState<CategoryFilter>("all");

  const [sheetDurationMs, setSheetDurationMs] = useState<number>(200);
  const [sheetEasing, setSheetEasing] = useState<string>("ease");

  const [popover, setPopover] = useState<{
    wordId: string;
    anchor: DOMRect;
  } | null>(null);

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

  useEffect(() => {
    if (!timerRunning) return;
    const id = setInterval(() => setTimerElapsedSec((s) => s + 1), 1000);
    return () => clearInterval(id);
  }, [timerRunning]);

  const toggleTimer = () => setTimerRunning((r) => !r);

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

  const updateMarkSub = (
    wordId: string,
    category: CategoryId,
    sub: SubCategory | null,
  ) => {
    const next = marks.map((m) =>
      m.wordId === wordId && m.category === category
        ? { ...m, subCategory: sub ?? undefined }
        : m,
    );
    pushHistory(next);
  };

  const openPopover = (wordId: string, anchor: DOMRect) => {
    setPopover({ wordId, anchor });
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
    setTimerRunning(false);
    setTimerElapsedSec(0);
    setDurationMinutes("");
    setNotes("");
    setRecency("new");
  };

  const confirmSession = () => {
    const payload = {
      pageNumber,
      sessionType,
      selfRating,
      historicalMistakes,
      durationMinutes: durationMinutes || null,
      timerElapsedSec,
      recency,
      notes: notes || null,
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
          <div className="mb-3 rounded-lg border border-amber-200 bg-amber-50 p-3 text-sm text-amber-700">
            Word-text lookup unavailable ({pageError}); the page image still
            renders.
          </div>
        )}
        <MushafPageView
          pageNumber={pageNumber}
          marks={marks}
          historicalMarks={historicalMistakes ? MOCK_HISTORICAL_MARKS : []}
          activeCategory={activeCategory}
          categoryFilter={categoryFilter}
          categories={CATEGORIES}
          onTapWord={toggleWord}
          onCommitDrag={applyMarksToWordIds}
          onLongPress={openPopover}
          debugBoxes={debugMode}
        />

        {popover && page && (() => {
          const w = page.words.find((x) => x.location === popover.wordId);
          if (!w) return null;
          return (
            <WordPopover
              anchor={popover.anchor}
              wordId={popover.wordId}
              wordText={w.text}
              marks={marks}
              categories={CATEGORIES}
              onUpdateSub={updateMarkSub}
              onClose={() => setPopover(null)}
            />
          );
        })()}
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
        durationMinutes={durationMinutes}
        setDurationMinutes={setDurationMinutes}
        timerRunning={timerRunning}
        timerElapsedSec={timerElapsedSec}
        toggleTimer={toggleTimer}
        recency={recency}
        setRecency={setRecency}
        notes={notes}
        setNotes={setNotes}
        onUndo={undo}
        canUndo={history.length > 0}
        onClearAll={clearAll}
        onConfirm={confirmSession}
        sheetDurationMs={sheetDurationMs}
        sheetEasing={sheetEasing}
      />

      {debugMode && (
        <DebugPanel
          paletteSize={paletteSize}
          setPaletteSize={setPaletteSize}
          countingMode={countingMode}
          setCountingMode={setCountingMode}
          sheetDurationMs={sheetDurationMs}
          setSheetDurationMs={setSheetDurationMs}
          sheetEasing={sheetEasing}
          setSheetEasing={setSheetEasing}
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
