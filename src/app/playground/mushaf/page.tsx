"use client";

/**
 * Mushaf mistake-marking prototype.
 *
 * Throwaway prototype. Not connected to your account or database.
 * See `docs/SOLO-WORKFLOW.md` and prompt for context.
 */

import { Suspense, useMemo, useState } from "react";
import { Amiri_Quran } from "next/font/google";
import { useSearchParams } from "next/navigation";

import { CATEGORIES, PASSAGES } from "./samples";
import type {
  CategoryId,
  CountingMode,
  Mark,
  PaletteSize,
  SessionType,
  SheetState,
} from "./types";
import { MushafView } from "./MushafView";
import { BottomSheet } from "./BottomSheet";
import { DebugPanel } from "./DebugPanel";

const amiriQuran = Amiri_Quran({ subsets: ["arabic"], weight: "400" });

function MushafPlayground() {
  const searchParams = useSearchParams();
  const debugMode = searchParams.get("debug") === "1";

  const [passageId, setPassageId] = useState<string>(PASSAGES[0].id);
  const [activeCategory, setActiveCategory] =
    useState<CategoryId>("tajweed");
  const [marks, setMarks] = useState<Mark[]>([]);
  const [history, setHistory] = useState<Mark[][]>([]);
  const [sheetState, setSheetState] = useState<SheetState>("collapsed");
  const [sessionType, setSessionType] = useState<SessionType>("audit");
  const [selfRating, setSelfRating] = useState<number>(7);
  const [historicalMistakes, setHistoricalMistakes] = useState<boolean>(false);

  const [paletteSize, setPaletteSize] = useState<PaletteSize>(4);
  const [countingMode, setCountingMode] = useState<CountingMode>("per-mark");

  const passage = useMemo(
    () => PASSAGES.find((p) => p.id === passageId) ?? PASSAGES[0],
    [passageId],
  );

  const visibleCategories = useMemo(() => {
    if (paletteSize === 2) {
      return CATEGORIES.filter(
        (c) => c.id === "tajweed" || c.id === "memorization",
      );
    }
    return CATEGORIES;
  }, [paletteSize]);

  // If palette shrinks and the active category is no longer visible, fall back.
  if (!visibleCategories.some((c) => c.id === activeCategory)) {
    // Reason: keep render pure by deferring state change via microtask.
    queueMicrotask(() => setActiveCategory(visibleCategories[0].id));
  }

  const pushHistory = (next: Mark[]) => {
    setHistory((h) => [...h, marks]);
    setMarks(next);
  };

  const applyMarksToWordIds = (wordIds: string[]) => {
    if (wordIds.length === 0) return;
    const wordIdSet = new Set(wordIds);
    const next = marks.filter((m) => !wordIdSet.has(m.wordId));
    for (const wid of wordIds) {
      next.push({ wordId: wid, category: activeCategory });
    }
    pushHistory(next);
  };

  const toggleWord = (wordId: string) => {
    const existing = marks.find((m) => m.wordId === wordId);
    if (!existing) {
      pushHistory([...marks, { wordId, category: activeCategory }]);
      return;
    }
    if (existing.category === activeCategory) {
      pushHistory(marks.filter((m) => m.wordId !== wordId));
      return;
    }
    pushHistory(
      marks.map((m) =>
        m.wordId === wordId ? { ...m, category: activeCategory } : m,
      ),
    );
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
      passageId: passage.id,
      surahNumber: passage.surahNumber,
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
      style={{ backgroundColor: "#FFFDF5" }}
      className="min-h-screen w-full pb-32"
    >
      <header className="mx-auto max-w-3xl px-6 pt-8 pb-4">
        <h1 className="text-2xl font-semibold text-stone-800">
          Mushaf Prototype — Playground
        </h1>
        <p className="mt-1 text-sm text-stone-500">
          Throwaway prototype. Not connected to your account or database.
        </p>

        <div
          className="mt-4 inline-flex rounded-full border border-stone-200 bg-white p-1"
          role="tablist"
          aria-label="Passage switcher"
        >
          {PASSAGES.map((p) => {
            const active = p.id === passage.id;
            return (
              <button
                key={p.id}
                type="button"
                role="tab"
                aria-selected={active}
                onClick={() => {
                  setPassageId(p.id);
                  // Reset state when switching passages — marks no longer apply.
                  setMarks([]);
                  setHistory([]);
                  setSheetState("collapsed");
                }}
                className={`rounded-full px-4 py-1.5 text-sm transition ${
                  active
                    ? "bg-stone-900 text-white"
                    : "text-stone-600 hover:bg-stone-50"
                }`}
              >
                {p.surahNameEnglish}
              </button>
            );
          })}
        </div>
      </header>

      <section className="mx-auto max-w-3xl px-6">
        <div className="mb-2 text-center text-sm text-stone-500">
          <span className="mr-2">سورة</span>
          <span className={amiriQuran.className} style={{ fontSize: 22 }}>
            {passage.surahNameArabic}
          </span>
        </div>
        <MushafView
          passage={passage}
          marks={marks}
          activeCategory={activeCategory}
          categories={CATEGORIES}
          fontClassName={amiriQuran.className}
          onTapWord={toggleWord}
          onCommitDrag={applyMarksToWordIds}
        />
      </section>

      <BottomSheet
        state={sheetState}
        setState={setSheetState}
        marks={marks}
        categories={CATEGORIES}
        visibleCategories={visibleCategories}
        activeCategory={activeCategory}
        setActiveCategory={setActiveCategory}
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
