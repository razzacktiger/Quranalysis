"use client";

/**
 * Mushaf mistake-marking prototype.
 *
 * Throwaway prototype. Not connected to your account or database.
 * See `docs/SOLO-WORKFLOW.md` and prompt for context.
 */

import { Suspense, useEffect, useMemo, useRef, useState } from "react";
import { useSearchParams } from "next/navigation";

import { CATEGORIES, MOCK_HISTORICAL_MARKS } from "./samples";
import type {
  CategoryFilter,
  CategoryId,
  CountingMode,
  Mark,
  MarkGrouping,
  PaletteSize,
  RecencyCategory,
  SessionType,
  SheetState,
} from "./types";
import { getPage, type PageData } from "./data/pageIndex";
import { getDisplayWordText, getMarkableGlyphLabel, initWordIndex, isRealWord } from "./data/wordIndex";
import { isWaqfMarkId } from "./data/alignPageBoxes";
import { MushafPageView, type HitDebugInfo } from "./MushafPageView";
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
  const [partnerPage, setPartnerPage] = useState<PageData | null>(null);
  const [pageError, setPageError] = useState<string | null>(null);
  const [viewMode, setViewMode] = useState<ViewMode>("single");
  const [wordIndexReady, setWordIndexReady] = useState<boolean>(false);

  // Must load before marking — decoration/rub detection is undefined until ready.
  useEffect(() => {
    initWordIndex()
      .then(() => setWordIndexReady(true))
      .catch((err) => {
        console.error("[mushaf] word index failed", err);
        setWordIndexReady(true);
      });
  }, []);

  // In spread mode the anchor (pageNumber) is the RIGHT page (odd), matching
  // the Madani Mushaf: pages pair (1,2),(3,4)... with the odd page on the
  // right and the even page on the left (RTL reading order).
  const inSpread = viewMode === "spread";
  const rightPage = inSpread ? spreadRightAnchor(pageNumber) : pageNumber;
  const leftPage = Math.min(MAX_PAGE, rightPage + 1);

  const pageIndexWords = useMemo(() => page?.words ?? [], [page]);
  const partnerIndexWords = useMemo(() => partnerPage?.words ?? [], [partnerPage]);

  const enterSpread = () => {
    setPageNumber(spreadRightAnchor(pageNumber));
    setViewMode("spread");
  };
  const setSpreadAnchor = (n: number) =>
    setPageNumber(spreadRightAnchor(Math.min(MAX_PAGE, Math.max(1, n))));

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
  // Default to counting mistakes (groups), which is the meaningful number.
  const [countingMode, setCountingMode] = useState<CountingMode>("per-range");
  const [markGrouping, setMarkGrouping] = useState<MarkGrouping>("one");
  const [lastHit, setLastHit] = useState<HitDebugInfo | null>(null);

  // Monotonic mistake-group id generator (stable across re-renders).
  const groupSeq = useRef<number>(0);
  const newGroupId = () => `g${++groupSeq.current}`;

  useEffect(() => {
    let cancelled = false;
    setPageError(null);
    getPage(rightPage)
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
  }, [rightPage]);

  // Load the partner (left) page's word text in spread mode so the long-press
  // popover can resolve words on either visible page.
  useEffect(() => {
    if (!inSpread) {
      setPartnerPage(null);
      return;
    }
    let cancelled = false;
    getPage(leftPage)
      .then((p) => {
        if (!cancelled) setPartnerPage(p);
      })
      .catch(() => {
        if (!cancelled) setPartnerPage(null);
      });
    return () => {
      cancelled = true;
    };
  }, [inSpread, leftPage]);

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
   * Drag commit. Behavior depends on the grouping mode (active category only):
   *  - "one":      the whole dragged range becomes ONE mistake. Words already
   *                marked with the active category are RE-grouped into the new
   *                shared group — i.e. dragging over existing marks merges them.
   *  - "separate": each dragged word becomes its own single-word mistake.
   *                Already-marked words are left untouched.
   */
  const applyMarksToWordIds = (wordIds: string[]) => {
    if (wordIds.length === 0) return;

    if (markGrouping === "one") {
      const gid = newGroupId();
      let changed = false;
      const next = marks.map((m) => {
        if (m.category === activeCategory && wordIds.includes(m.wordId)) {
          if (m.groupId !== gid) changed = true;
          return { ...m, groupId: gid };
        }
        return m;
      });
      for (const wid of wordIds) {
        const exists = marks.some(
          (m) => m.wordId === wid && m.category === activeCategory,
        );
        if (!exists) {
          next.push({ wordId: wid, category: activeCategory, groupId: gid });
          changed = true;
        }
      }
      if (changed) pushHistory(next);
      return;
    }

    // "separate": one mistake per newly marked word.
    const next = [...marks];
    for (const wid of wordIds) {
      const exists = next.some(
        (m) => m.wordId === wid && m.category === activeCategory,
      );
      if (!exists)
        next.push({
          wordId: wid,
          category: activeCategory,
          groupId: newGroupId(),
        });
    }
    if (next.length === marks.length) return;
    pushHistory(next);
  };

  /**
   * Tap behavior. A single-word tap toggles that word. Tapping a decorative
   * glyph (ayah marker etc.) arrives here as multiple word ids — treated like
   * a one-mistake drag using the current grouping mode.
   */
  const tapWords = (wordIds: string[]) => {
    if (wordIds.length === 0) return;
    if (wordIds.length === 1) {
      toggleWord(wordIds[0]);
      return;
    }

    const allMarked = wordIds.every((wid) =>
      marks.some((m) => m.wordId === wid && m.category === activeCategory),
    );
    if (allMarked) {
      pushHistory(
        marks.filter(
          (m) =>
            !(wordIds.includes(m.wordId) && m.category === activeCategory),
        ),
      );
      return;
    }
    applyMarksToWordIds(wordIds);
  };

  /** Toggle the active category on a single real word. */
  const toggleWord = (wordId: string) => {
    const idx = marks.findIndex(
      (m) => m.wordId === wordId && m.category === activeCategory,
    );
    if (idx >= 0) {
      const next = [...marks];
      next.splice(idx, 1);
      pushHistory(next);
    } else {
      pushHistory([
        ...marks,
        { wordId, category: activeCategory, groupId: newGroupId() },
      ]);
    }
  };

  /**
   * Split the mistake group that a given (word, category) belongs to into
   * separate single-word mistakes — each member word gets a fresh group.
   */
  const splitGroup = (wordId: string, category: CategoryId) => {
    const target = marks.find(
      (m) => m.wordId === wordId && m.category === category,
    );
    if (!target) return;
    const members = marks.filter(
      (m) => m.category === category && m.groupId === target.groupId,
    );
    if (members.length <= 1) return;
    const next = marks.map((m) =>
      m.category === category && m.groupId === target.groupId
        ? { ...m, groupId: newGroupId() }
        : m,
    );
    pushHistory(next);
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
      markGrouping,
      markCount: marks.length,
      mistakeCount: new Set(marks.map((m) => m.groupId)).size,
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

        <div className="mt-3 inline-flex rounded-lg border border-stone-200 bg-white p-0.5">
          <button
            type="button"
            onClick={() => setViewMode("single")}
            aria-pressed={!inSpread}
            className={`rounded-md px-3 py-1 text-sm transition ${
              !inSpread
                ? "bg-stone-900 text-white"
                : "text-stone-600 hover:bg-stone-50"
            }`}
          >
            Single page
          </button>
          <button
            type="button"
            onClick={enterSpread}
            aria-pressed={inSpread}
            className={`rounded-md px-3 py-1 text-sm transition ${
              inSpread
                ? "bg-stone-900 text-white"
                : "text-stone-600 hover:bg-stone-50"
            }`}
          >
            Two-page spread
          </button>
        </div>
      </header>

      <PageNav
        pageNumber={pageNumber}
        setPageNumber={inSpread ? setSpreadAnchor : setPageNumber}
        step={inSpread ? 2 : 1}
      />

      <section
        className={`mx-auto px-4 ${inSpread ? "max-w-5xl" : "max-w-3xl"}`}
      >
        {pageError && (
          <div className="mb-3 rounded-lg border border-amber-200 bg-amber-50 p-3 text-sm text-amber-700">
            Word-text lookup unavailable ({pageError}); the page image still
            renders.
          </div>
        )}

        {!wordIndexReady ? (
          <div className="flex aspect-[1260/2048] items-center justify-center rounded-lg border border-stone-200 bg-white text-sm text-stone-400">
            Loading word map…
          </div>
        ) : inSpread ? (
          <div className="flex items-start gap-3">
            {/* RTL: higher (even) page on the left, lower (odd) page on the right. */}
            <div className="min-w-0 flex-1">
              <MushafPageView
                pageNumber={leftPage}
                indexWords={partnerIndexWords}
                marks={marks}
                historicalMarks={
                  historicalMistakes ? MOCK_HISTORICAL_MARKS : []
                }
                activeCategory={activeCategory}
                categoryFilter={categoryFilter}
                categories={CATEGORIES}
                onTapWord={tapWords}
                onCommitDrag={applyMarksToWordIds}
                onLongPress={openPopover}
                debugBoxes={debugMode}
                onHitDebug={debugMode ? setLastHit : undefined}
              />
            </div>
            <div className="min-w-0 flex-1">
              <MushafPageView
                pageNumber={rightPage}
                indexWords={pageIndexWords}
                marks={marks}
                historicalMarks={
                  historicalMistakes ? MOCK_HISTORICAL_MARKS : []
                }
                activeCategory={activeCategory}
                categoryFilter={categoryFilter}
                categories={CATEGORIES}
                onTapWord={tapWords}
                onCommitDrag={applyMarksToWordIds}
                onLongPress={openPopover}
                debugBoxes={debugMode}
                onHitDebug={debugMode ? setLastHit : undefined}
              />
            </div>
          </div>
        ) : (
          <MushafPageView
            pageNumber={pageNumber}
            indexWords={pageIndexWords}
            marks={marks}
            historicalMarks={historicalMistakes ? MOCK_HISTORICAL_MARKS : []}
            activeCategory={activeCategory}
            categoryFilter={categoryFilter}
            categories={CATEGORIES}
            onTapWord={tapWords}
            onCommitDrag={applyMarksToWordIds}
            onLongPress={openPopover}
            debugBoxes={debugMode}
            onHitDebug={debugMode ? setLastHit : undefined}
          />
        )}

        {popover && (() => {
          const w =
            page?.words.find((x) => x.location === popover.wordId) ??
            partnerPage?.words.find((x) => x.location === popover.wordId);
          const isWaqfMark = isWaqfMarkId(popover.wordId);
          if (!w && !isWaqfMark) return null;
          return (
            <WordPopover
              anchor={popover.anchor}
              wordId={popover.wordId}
              wordText={
                w
                  ? getDisplayWordText(popover.wordId) ||
                    w.text.replace(/^\u06DE\s*/, "")
                  : getMarkableGlyphLabel(popover.wordId)
              }
              marks={marks}
              categories={CATEGORIES}
              onUpdateSub={updateMarkSub}
              onSplitGroup={splitGroup}
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
        markGrouping={markGrouping}
        setMarkGrouping={setMarkGrouping}
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
          lastHit={lastHit}
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

type ViewMode = "single" | "spread";

const MAX_PAGE = 604;

/**
 * The right (odd) page of the spread a given page belongs to. Madani Mushaf
 * spreads pair (1,2),(3,4)...; the odd page sits on the right in RTL reading.
 */
function spreadRightAnchor(p: number): number {
  const clamped = Math.min(MAX_PAGE, Math.max(1, p));
  return clamped % 2 === 1 ? clamped : clamped - 1;
}
