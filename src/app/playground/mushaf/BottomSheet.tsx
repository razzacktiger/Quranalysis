"use client";

/**
 * 3-state bottom sheet for the Mushaf prototype.
 *
 *   collapsed (~80px) -> expanded (~50vh) -> full (~90vh)
 *
 * Transitions:
 *   - Tap chevron up   : cycle towards full
 *   - Tap chevron down : cycle towards collapsed
 *   - Save             : jump to full
 *   - Confirm / Cancel : jump to expanded (or reset after confirm)
 *   - Drag handle      : pointer-based swipe with 30px threshold
 *
 * Quality bar: prototype. No focus traps, no a11y polish beyond aria labels.
 */

import { useMemo, useRef } from "react";
import { CategoryPalette } from "./CategoryPalette";
import type {
  Category,
  CategoryFilter,
  CategoryId,
  CountingMode,
  Mark,
  RecencyCategory,
  SessionType,
  SheetState,
} from "./types";

type Props = {
  state: SheetState;
  setState: (s: SheetState) => void;
  marks: Mark[];
  categories: Category[];
  visibleCategories: Category[];
  activeCategory: CategoryId;
  setActiveCategory: (id: CategoryId) => void;
  categoryFilter: CategoryFilter;
  setCategoryFilter: (f: CategoryFilter) => void;
  countingMode: CountingMode;
  sessionType: SessionType;
  setSessionType: (s: SessionType) => void;
  selfRating: number;
  setSelfRating: (n: number) => void;
  historicalMistakes: boolean;
  setHistoricalMistakes: (b: boolean) => void;
  durationMinutes: string;
  setDurationMinutes: (s: string) => void;
  timerRunning: boolean;
  timerElapsedSec: number;
  toggleTimer: () => void;
  recency: RecencyCategory;
  setRecency: (r: RecencyCategory) => void;
  notes: string;
  setNotes: (n: string) => void;
  onUndo: () => void;
  canUndo: boolean;
  onClearAll: () => void;
  onConfirm: () => void;
  /** Sheet height transition tuning (debug panel). Defaults: 200ms / ease. */
  sheetDurationMs?: number;
  sheetEasing?: string;
};

const SESSION_TYPES: { id: SessionType; label: string }[] = [
  { id: "audit", label: "Audit" },
  { id: "memorization", label: "Memorization" },
  { id: "pronunciation", label: "Pronunciation" },
  { id: "translation", label: "Translation" },
];

export function BottomSheet({
  state,
  setState,
  marks,
  categories,
  visibleCategories,
  activeCategory,
  setActiveCategory,
  categoryFilter,
  setCategoryFilter,
  countingMode,
  sessionType,
  setSessionType,
  selfRating,
  setSelfRating,
  historicalMistakes,
  setHistoricalMistakes,
  durationMinutes,
  setDurationMinutes,
  timerRunning,
  timerElapsedSec,
  toggleTimer,
  recency,
  setRecency,
  notes,
  setNotes,
  onUndo,
  canUndo,
  onClearAll,
  onConfirm,
  sheetDurationMs = 200,
  sheetEasing = "ease",
}: Props) {
  const sheetHeight =
    state === "collapsed" ? "80px" : state === "expanded" ? "50vh" : "90vh";

  const cycleUp = () => {
    if (state === "collapsed") setState("expanded");
    else if (state === "expanded") setState("full");
  };
  const cycleDown = () => {
    if (state === "full") setState("expanded");
    else if (state === "expanded") setState("collapsed");
  };

  // Swipe handling on the grab handle.
  const swipeStartY = useRef<number | null>(null);
  const onHandlePointerDown = (e: React.PointerEvent) => {
    swipeStartY.current = e.clientY;
  };
  const onHandlePointerUp = (e: React.PointerEvent) => {
    const start = swipeStartY.current;
    swipeStartY.current = null;
    if (start == null) return;
    const dy = e.clientY - start;
    if (Math.abs(dy) < 30) {
      // Treat as tap — toggle one step.
      if (state === "collapsed") cycleUp();
      else cycleDown();
      return;
    }
    if (dy < 0) cycleUp();
    else cycleDown();
  };

  const activeCat = useMemo(
    () => categories.find((c) => c.id === activeCategory) ?? categories[0],
    [categories, activeCategory],
  );

  const countByCategory = useMemo(() => {
    const map = new Map<CategoryId, number>();
    for (const m of marks) {
      map.set(m.category, (map.get(m.category) ?? 0) + 1);
    }
    return map;
  }, [marks]);

  /** Marks visible after applying the active category filter. */
  const filteredMarks = useMemo(() => {
    if (categoryFilter === "all") return marks;
    return marks.filter((m) => m.category === categoryFilter);
  }, [marks, categoryFilter]);

  const displayCount = useMemo(() => {
    if (countingMode === "per-mark") return filteredMarks.length;
    return computePerRangeCount(filteredMarks);
  }, [filteredMarks, countingMode]);

  return (
    <div
      role="dialog"
      aria-label="Session controls"
      className="fixed inset-x-0 bottom-0 z-30 flex flex-col rounded-t-3xl bg-white shadow-[0_-8px_24px_rgba(0,0,0,0.08)]"
      style={{
        height: sheetHeight,
        transition: `height ${sheetDurationMs}ms ${sheetEasing}`,
        overflow: "hidden",
      }}
    >
      <div
        className="flex flex-col items-center pt-2 pb-1"
        onPointerDown={onHandlePointerDown}
        onPointerUp={onHandlePointerUp}
        style={{ cursor: "grab", touchAction: "none" }}
      >
        <span className="h-1.5 w-12 rounded-full bg-stone-300" />
      </div>

      {state === "collapsed" && (
        <CollapsedBody
          activeColor={activeCat.color}
          activeLabel={activeCat.label}
          count={displayCount}
          countingMode={countingMode}
          markCount={filteredMarks.length}
          filterActive={categoryFilter !== "all"}
          timerRunning={timerRunning}
          timerElapsedSec={timerElapsedSec}
          onSwatchClick={cycleUp}
          onUndo={onUndo}
          canUndo={canUndo}
          onExpand={cycleUp}
          onSave={() => setState("full")}
        />
      )}

      {state === "expanded" && (
        <ExpandedBody
          visibleCategories={visibleCategories}
          categories={categories}
          activeCategory={activeCategory}
          setActiveCategory={setActiveCategory}
          categoryFilter={categoryFilter}
          setCategoryFilter={setCategoryFilter}
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
          onClearAll={onClearAll}
          markCount={marks.length}
          onCollapse={cycleDown}
          onSave={() => setState("full")}
        />
      )}

      {state === "full" && (
        <FullBody
          marks={filteredMarks}
          categories={categories}
          countByCategory={countByCategory}
          sessionType={sessionType}
          selfRating={selfRating}
          historicalMistakes={historicalMistakes}
          displayCount={displayCount}
          countingMode={countingMode}
          categoryFilter={categoryFilter}
          durationMinutes={durationMinutes}
          timerElapsedSec={timerElapsedSec}
          recency={recency}
          notes={notes}
          onConfirm={onConfirm}
          onCancel={() => setState("expanded")}
        />
      )}
    </div>
  );
}

function CollapsedBody({
  activeColor,
  activeLabel,
  count,
  countingMode,
  markCount,
  filterActive,
  timerRunning,
  timerElapsedSec,
  onSwatchClick,
  onUndo,
  canUndo,
  onExpand,
  onSave,
}: {
  activeColor: string;
  activeLabel: string;
  count: number;
  countingMode: CountingMode;
  markCount: number;
  filterActive: boolean;
  timerRunning: boolean;
  timerElapsedSec: number;
  onSwatchClick: () => void;
  onUndo: () => void;
  canUndo: boolean;
  onExpand: () => void;
  onSave: () => void;
}) {
  return (
    <div className="flex flex-1 items-center gap-3 px-4">
      <button
        type="button"
        aria-label={`Active category: ${activeLabel}. Tap to open palette.`}
        onClick={onSwatchClick}
        className="flex items-center gap-2"
      >
        <span
          style={{
            width: 36,
            height: 36,
            borderRadius: "50%",
            backgroundColor: activeColor,
            border: "2px solid #fff",
            boxShadow: "0 0 0 2px #1c1917",
          }}
        />
        <span className="text-sm font-medium text-stone-700">
          {activeLabel}
        </span>
      </button>

      <button
        type="button"
        onClick={onUndo}
        disabled={!canUndo}
        className="rounded-lg px-3 py-2 text-sm text-stone-600 hover:bg-stone-100 disabled:opacity-30"
        aria-label="Undo last action"
      >
        ↶ Undo
      </button>

      <div className="ml-auto flex items-center gap-3">
        {(timerRunning || timerElapsedSec > 0) && (
          <span
            className={`rounded-full px-2 py-0.5 font-mono text-xs ${
              timerRunning
                ? "bg-emerald-50 text-emerald-700"
                : "bg-stone-100 text-stone-500"
            }`}
            aria-label="Session duration"
          >
            {timerRunning ? "● " : ""}
            {formatDuration(timerElapsedSec)}
          </span>
        )}
        <span className="text-sm text-stone-600">
          <strong className="text-stone-900">{count}</strong>{" "}
          {countingMode === "per-range" ? "ranges" : "marks"}
          {countingMode === "per-range" && count !== markCount && (
            <span className="ml-1 text-xs text-stone-400">
              ({markCount} words)
            </span>
          )}
          {filterActive && (
            <span className="ml-1 text-xs text-stone-400">(filtered)</span>
          )}
        </span>

        {markCount > 0 && (
          <button
            type="button"
            onClick={onSave}
            className="rounded-lg bg-stone-900 px-4 py-2 text-sm font-medium text-white hover:bg-stone-800"
          >
            Save
          </button>
        )}

        <button
          type="button"
          aria-label="Expand sheet"
          onClick={onExpand}
          className="rounded-lg p-2 text-stone-500 hover:bg-stone-100"
        >
          <ChevronUp />
        </button>
      </div>
    </div>
  );
}

function ExpandedBody({
  visibleCategories,
  categories,
  activeCategory,
  setActiveCategory,
  categoryFilter,
  setCategoryFilter,
  sessionType,
  setSessionType,
  selfRating,
  setSelfRating,
  historicalMistakes,
  setHistoricalMistakes,
  durationMinutes,
  setDurationMinutes,
  timerRunning,
  timerElapsedSec,
  toggleTimer,
  recency,
  setRecency,
  notes,
  setNotes,
  onClearAll,
  markCount,
  onCollapse,
  onSave,
}: {
  visibleCategories: Category[];
  categories: Category[];
  activeCategory: CategoryId;
  setActiveCategory: (id: CategoryId) => void;
  categoryFilter: CategoryFilter;
  setCategoryFilter: (f: CategoryFilter) => void;
  sessionType: SessionType;
  setSessionType: (s: SessionType) => void;
  selfRating: number;
  setSelfRating: (n: number) => void;
  historicalMistakes: boolean;
  setHistoricalMistakes: (b: boolean) => void;
  durationMinutes: string;
  setDurationMinutes: (s: string) => void;
  timerRunning: boolean;
  timerElapsedSec: number;
  toggleTimer: () => void;
  recency: RecencyCategory;
  setRecency: (r: RecencyCategory) => void;
  notes: string;
  setNotes: (n: string) => void;
  onClearAll: () => void;
  markCount: number;
  onCollapse: () => void;
  onSave: () => void;
}) {
  return (
    <div className="flex flex-1 flex-col gap-5 overflow-y-auto px-5 pb-5">
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-semibold text-stone-800">Session</h2>
        <button
          type="button"
          aria-label="Collapse sheet"
          onClick={onCollapse}
          className="rounded-lg p-2 text-stone-500 hover:bg-stone-100"
        >
          <ChevronDown />
        </button>
      </div>

      <div>
        <p className="mb-2 text-xs uppercase tracking-wide text-stone-400">
          Category
        </p>
        <CategoryPalette
          categories={visibleCategories}
          activeCategory={activeCategory}
          onSelect={setActiveCategory}
        />
      </div>

      <div>
        <p className="mb-2 text-xs uppercase tracking-wide text-stone-400">
          View
        </p>
        <div className="flex flex-wrap items-center gap-2">
          <FilterChip
            label="All"
            active={categoryFilter === "all"}
            color="#1c1917"
            onClick={() => setCategoryFilter("all")}
          />
          {categories.map((c) => (
            <FilterChip
              key={c.id}
              label={c.label}
              active={categoryFilter === c.id}
              color={c.color}
              onClick={() => setCategoryFilter(c.id)}
            />
          ))}
        </div>
      </div>

      <div>
        <p className="mb-2 text-xs uppercase tracking-wide text-stone-400">
          Session type
        </p>
        <div className="flex flex-wrap gap-2">
          {SESSION_TYPES.map((st) => {
            const active = st.id === sessionType;
            return (
              <button
                key={st.id}
                type="button"
                onClick={() => setSessionType(st.id)}
                className={`rounded-full border px-3 py-1.5 text-sm transition ${
                  active
                    ? "border-stone-900 bg-stone-900 text-white"
                    : "border-stone-200 text-stone-600 hover:bg-stone-50"
                }`}
              >
                {st.label}
              </button>
            );
          })}
        </div>
      </div>

      <div>
        <div className="mb-2 flex items-center justify-between">
          <p className="text-xs uppercase tracking-wide text-stone-400">
            Self-rating
          </p>
          <span className="text-sm font-medium text-stone-800">
            {selfRating} / 10
          </span>
        </div>
        <input
          type="range"
          min={1}
          max={10}
          value={selfRating}
          onChange={(e) => setSelfRating(Number(e.target.value))}
          className="w-full accent-stone-900"
        />
      </div>

      <label className="flex items-center justify-between">
        <span className="text-sm text-stone-700">Historical Mistakes</span>
        <input
          type="checkbox"
          checked={historicalMistakes}
          onChange={(e) => setHistoricalMistakes(e.target.checked)}
          className="ml-2 h-5 w-5 accent-stone-900"
        />
      </label>

      <div>
        <p className="mb-2 text-xs uppercase tracking-wide text-stone-400">
          Duration
        </p>
        <div className="flex items-center gap-2">
          <input
            type="number"
            min={1}
            max={120}
            placeholder="minutes"
            value={durationMinutes}
            onChange={(e) => setDurationMinutes(e.target.value)}
            className="w-28 rounded-md border border-stone-200 bg-white px-2 py-1.5 text-sm text-stone-900 placeholder:text-stone-400"
            aria-label="Duration in minutes"
          />
          <button
            type="button"
            onClick={toggleTimer}
            className={`rounded-md border px-3 py-1.5 text-sm transition ${
              timerRunning
                ? "border-emerald-500 bg-emerald-50 text-emerald-700"
                : "border-stone-200 text-stone-700 hover:bg-stone-50"
            }`}
            aria-pressed={timerRunning}
          >
            {timerRunning ? "Stop timer" : "Start timer"}
          </button>
          {(timerRunning || timerElapsedSec > 0) && (
            <span className="font-mono text-sm text-stone-600">
              {timerRunning ? "● " : ""}
              {formatDuration(timerElapsedSec)}
            </span>
          )}
        </div>
      </div>

      <div>
        <p className="mb-2 text-xs uppercase tracking-wide text-stone-400">
          Recency
        </p>
        <div className="flex flex-wrap gap-2">
          {(["new", "near", "far"] as RecencyCategory[]).map((r) => {
            const active = r === recency;
            return (
              <button
                key={r}
                type="button"
                onClick={() => setRecency(r)}
                className={`rounded-full border px-3 py-1.5 text-sm capitalize transition ${
                  active
                    ? "border-stone-900 bg-stone-900 text-white"
                    : "border-stone-200 text-stone-600 hover:bg-stone-50"
                }`}
              >
                {r}
              </button>
            );
          })}
        </div>
      </div>

      <div>
        <p className="mb-2 text-xs uppercase tracking-wide text-stone-400">
          Notes
        </p>
        <textarea
          rows={3}
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
          placeholder="Reflections from this session…"
          className="w-full resize-y rounded-md border border-stone-200 bg-white px-2 py-1.5 text-sm text-stone-900 placeholder:text-stone-400"
        />
      </div>

      <div className="mt-auto flex items-center gap-3 pt-2">
        <button
          type="button"
          onClick={onClearAll}
          disabled={markCount === 0}
          className="rounded-lg border border-stone-200 px-3 py-2 text-sm text-stone-600 hover:bg-stone-50 disabled:opacity-30"
        >
          Clear All
        </button>
        <button
          type="button"
          onClick={onSave}
          disabled={markCount === 0}
          className="ml-auto rounded-lg bg-stone-900 px-5 py-2 text-sm font-medium text-white hover:bg-stone-800 disabled:bg-stone-300"
        >
          Save ({markCount})
        </button>
      </div>
    </div>
  );
}

function FilterChip({
  label,
  active,
  color,
  onClick,
}: {
  label: string;
  active: boolean;
  color: string;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-pressed={active}
      className={`flex items-center gap-1.5 rounded-full border px-3 py-1 text-xs transition ${
        active
          ? "border-stone-900 bg-stone-900 text-white"
          : "border-stone-200 text-stone-600 hover:bg-stone-50"
      }`}
    >
      <span
        aria-hidden
        style={{
          width: 8,
          height: 8,
          borderRadius: "50%",
          backgroundColor: color,
          border: active ? "1px solid #fff" : "1px solid transparent",
        }}
      />
      {label}
    </button>
  );
}

function FullBody({
  marks,
  categories,
  countByCategory,
  sessionType,
  selfRating,
  historicalMistakes,
  displayCount,
  countingMode,
  categoryFilter,
  durationMinutes,
  timerElapsedSec,
  recency,
  notes,
  onConfirm,
  onCancel,
}: {
  marks: Mark[];
  categories: Category[];
  countByCategory: Map<CategoryId, number>;
  sessionType: SessionType;
  selfRating: number;
  historicalMistakes: boolean;
  displayCount: number;
  countingMode: CountingMode;
  categoryFilter: CategoryFilter;
  durationMinutes: string;
  timerElapsedSec: number;
  recency: RecencyCategory;
  notes: string;
  onConfirm: () => void;
  onCancel: () => void;
}) {
  const sortedMarks = useMemo(
    () =>
      [...marks].sort((a, b) => compareWordId(a.wordId, b.wordId)),
    [marks],
  );

  return (
    <div className="flex flex-1 flex-col overflow-y-auto px-5 pb-5">
      <div className="flex items-center justify-between py-2">
        <h2 className="text-lg font-semibold text-stone-800">
          Session summary
        </h2>
        <button
          type="button"
          onClick={onCancel}
          aria-label="Back to expanded view"
          className="rounded-lg p-2 text-stone-500 hover:bg-stone-100"
        >
          <ChevronDown />
        </button>
      </div>

      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        {categories.map((c) => (
          <div
            key={c.id}
            className="rounded-xl border border-stone-100 bg-stone-50 px-3 py-2"
          >
            <div className="flex items-center gap-2">
              <span
                style={{
                  width: 14,
                  height: 14,
                  borderRadius: 4,
                  backgroundColor: c.color,
                  display: "inline-block",
                }}
              />
              <span className="text-xs text-stone-500">{c.label}</span>
            </div>
            <div className="mt-1 text-2xl font-semibold text-stone-900">
              {countByCategory.get(c.id) ?? 0}
            </div>
          </div>
        ))}
      </div>

      <div className="mt-4 grid grid-cols-3 gap-3 text-sm">
        <SummaryRow label="Session type" value={sessionType} />
        <SummaryRow label="Self-rating" value={`${selfRating} / 10`} />
        <SummaryRow
          label="Historical"
          value={historicalMistakes ? "on" : "off"}
        />
        <SummaryRow label="Recency" value={recency} />
        <SummaryRow
          label="Duration"
          value={
            durationMinutes
              ? `${durationMinutes} min`
              : timerElapsedSec > 0
                ? formatDuration(timerElapsedSec)
                : "—"
          }
        />
      </div>

      {notes.trim().length > 0 && (
        <div className="mt-3">
          <p className="text-[10px] uppercase tracking-wide text-stone-400">
            Notes
          </p>
          <p className="mt-0.5 whitespace-pre-wrap rounded-lg border border-stone-100 bg-white px-3 py-2 text-sm text-stone-700">
            {notes}
          </p>
        </div>
      )}

      <div className="mt-4">
        <p className="text-xs uppercase tracking-wide text-stone-400">
          Marked words ({displayCount} {countingMode === "per-range" ? "ranges" : "marks"})
          {categoryFilter !== "all" && (
            <span className="ml-1 normal-case text-stone-500">
              · filtered to {categoryFilter}
            </span>
          )}
        </p>
        <div className="mt-2 max-h-48 overflow-y-auto rounded-lg border border-stone-100 bg-stone-50 p-2 font-mono text-xs">
          {sortedMarks.length === 0 ? (
            <p className="text-stone-400">No marks yet.</p>
          ) : (
            sortedMarks.map((m) => (
              <div
                key={m.wordId}
                className="flex items-center justify-between py-0.5"
              >
                <span className="text-stone-700">{m.wordId}</span>
                <span className="text-stone-400">{m.category}</span>
              </div>
            ))
          )}
        </div>
      </div>

      <div className="mt-auto flex items-center gap-3 pt-4">
        <button
          type="button"
          onClick={onCancel}
          className="rounded-lg border border-stone-200 px-4 py-2 text-sm text-stone-700 hover:bg-stone-50"
        >
          Cancel
        </button>
        <button
          type="button"
          onClick={onConfirm}
          className="ml-auto rounded-lg bg-emerald-600 px-5 py-2 text-sm font-medium text-white hover:bg-emerald-500"
        >
          Confirm
        </button>
      </div>
    </div>
  );
}

function SummaryRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-lg border border-stone-100 bg-white px-3 py-2">
      <p className="text-[10px] uppercase tracking-wide text-stone-400">
        {label}
      </p>
      <p className="mt-0.5 text-sm font-medium capitalize text-stone-800">
        {value}
      </p>
    </div>
  );
}

function ChevronUp() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" aria-hidden>
      <path
        d="M6 15l6-6 6 6"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

function ChevronDown() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" aria-hidden>
      <path
        d="M6 9l6 6 6-6"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
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

/** Formats elapsed seconds as M:SS (or H:MM:SS past an hour). */
function formatDuration(totalSec: number): string {
  const s = Math.max(0, Math.floor(totalSec));
  const hrs = Math.floor(s / 3600);
  const mins = Math.floor((s % 3600) / 60);
  const secs = s % 60;
  const pad = (n: number) => String(n).padStart(2, "0");
  if (hrs > 0) return `${hrs}:${pad(mins)}:${pad(secs)}`;
  return `${mins}:${pad(secs)}`;
}

/**
 * Per-range counting: sort marks by surah:ayah:position and group consecutive
 * marks of the same category that are sequential within the same ayah.
 *
 * Example: 1:1:1, 1:1:2 same category = 1 range. 1:1:1, 1:1:3 same category
 * = 2 ranges (gap). 1:1:1, 1:2:1 same category = 2 ranges (ayah boundary).
 */
function computePerRangeCount(marks: Mark[]): number {
  if (marks.length === 0) return 0;
  const sorted = [...marks].sort((a, b) => compareWordId(a.wordId, b.wordId));
  let ranges = 0;
  let prev: { surah: number; ayah: number; pos: number; cat: CategoryId } | null =
    null;
  for (const m of sorted) {
    const [s, a, p] = m.wordId.split(":").map(Number);
    if (
      prev &&
      prev.cat === m.category &&
      prev.surah === s &&
      prev.ayah === a &&
      prev.pos + 1 === p
    ) {
      // continuation of current range
    } else {
      ranges += 1;
    }
    prev = { surah: s, ayah: a, pos: p, cat: m.category };
  }
  return ranges;
}
