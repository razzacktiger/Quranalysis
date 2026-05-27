"use client";

/**
 * Renders the current Mushaf page with structurally-correct Madani layout:
 * words grouped by `line`, lines flex-justified RTL.
 *
 * PROTOTYPE LIMITATION: This uses CSS flex-justified text to approximate the
 * Madani Mushaf layout. The lines/pages are structurally correct (right words
 * on right lines on right pages) but kerning, ligatures, and glyph spacing
 * are browser-controlled, NOT pixel-perfect to a printed Mushaf. Production
 * build (Epic 2) will swap to CDN page images + bbox overlay for true pixel
 * fidelity. See docs/SOLO-WORKFLOW.md §11 and the mobile repo's
 * components/mushaf/MushafPageImage.tsx + lib/data/ayahInfoDb.ts.
 *
 * Pointer behavior is identical to v1 — tap a word, or drag across multiple
 * words. We use document.elementFromPoint + data-word-id so we never have to
 * compute geometry ourselves.
 *
 * Multi-category marks render as stacked color stripes directly below each
 * word, ordered top-to-bottom in STRIPE_ORDER (tajweed / memorization /
 * pronunciation / translation).
 */

import { useMemo, useRef, useState } from "react";
import { toArabicNumerals, type PageData, type PageWord } from "./data/pageIndex";
import { STRIPE_ORDER } from "./samples";
import type {
  Category,
  CategoryFilter,
  CategoryId,
  HistoricalMark,
  Mark,
} from "./types";

type Props = {
  page: PageData;
  marks: Mark[];
  historicalMarks?: HistoricalMark[];
  activeCategory: CategoryId;
  categoryFilter: CategoryFilter;
  categories: Category[];
  fontClassName: string;
  onTapWord: (wordId: string) => void;
  onCommitDrag: (wordIds: string[]) => void;
  onLongPress?: (wordId: string, anchor: DOMRect) => void;
};

const STRIPE_HEIGHT = 3;
const STRIPE_GAP = 1;

export function MushafView({
  page,
  marks,
  historicalMarks = [],
  activeCategory,
  categoryFilter,
  categories,
  fontClassName,
  onTapWord,
  onCommitDrag,
  onLongPress,
}: Props) {
  const isDraggingRef = useRef<boolean>(false);
  const pendingRef = useRef<Set<string>>(new Set());
  const dragStartWordRef = useRef<string | null>(null);
  const dragMovedRef = useRef<boolean>(false);
  const longPressTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const longPressStartRef = useRef<{ x: number; y: number } | null>(null);
  const longPressFiredRef = useRef<boolean>(false);
  const [, forcePendingRender] = useState<number>(0);

  const categoryById: Record<CategoryId, Category> = useMemo(() => {
    return categories.reduce(
      (acc, c) => ({ ...acc, [c.id]: c }),
      {} as Record<CategoryId, Category>,
    );
  }, [categories]);

  /** wordId -> set of categories currently marked on it */
  const marksByWord = useMemo(() => {
    const m = new Map<string, Set<CategoryId>>();
    for (const mk of marks) {
      if (!m.has(mk.wordId)) m.set(mk.wordId, new Set());
      m.get(mk.wordId)!.add(mk.category);
    }
    return m;
  }, [marks]);

  /** wordId -> set of historical categories */
  const historicalByWord = useMemo(() => {
    const m = new Map<string, Set<CategoryId>>();
    for (const hm of historicalMarks) {
      if (!m.has(hm.wordId)) m.set(hm.wordId, new Set());
      m.get(hm.wordId)!.add(hm.category);
    }
    return m;
  }, [historicalMarks]);

  const passesFilter = (cat: CategoryId): boolean =>
    categoryFilter === "all" || categoryFilter === cat;

  const wordIdAtPoint = (x: number, y: number): string | null => {
    const el = document.elementFromPoint(x, y) as HTMLElement | null;
    if (!el) return null;
    const wid = el.closest<HTMLElement>("[data-word-id]")?.dataset.wordId;
    return wid ?? null;
  };

  const clearLongPress = () => {
    if (longPressTimerRef.current) {
      clearTimeout(longPressTimerRef.current);
      longPressTimerRef.current = null;
    }
    longPressStartRef.current = null;
  };

  const onPointerDown = (e: React.PointerEvent<HTMLDivElement>) => {
    if (e.button !== 0 && e.pointerType === "mouse") return;
    const wid = wordIdAtPoint(e.clientX, e.clientY);
    if (!wid) return;
    try {
      e.currentTarget.setPointerCapture(e.pointerId);
    } catch {
      // ignore
    }
    isDraggingRef.current = true;
    dragStartWordRef.current = wid;
    dragMovedRef.current = false;
    longPressFiredRef.current = false;
    pendingRef.current = new Set<string>([wid]);
    forcePendingRender((n) => n + 1);

    if (onLongPress && marksByWord.has(wid)) {
      longPressStartRef.current = { x: e.clientX, y: e.clientY };
      const startX = e.clientX;
      const startY = e.clientY;
      const targetWid = wid;
      const targetEl = (e.target as HTMLElement)?.closest<HTMLElement>(
        "[data-word-id]",
      );
      longPressTimerRef.current = setTimeout(() => {
        const rect = targetEl?.getBoundingClientRect();
        if (rect) {
          longPressFiredRef.current = true;
          onLongPress(targetWid, rect);
        }
        longPressTimerRef.current = null;
        // Cancel the in-flight drag so we don't also commit a mark.
        isDraggingRef.current = false;
        pendingRef.current = new Set();
        forcePendingRender((n) => n + 1);
        // Suppress dummy reference warnings.
        void startX;
        void startY;
      }, 500);
    }
  };

  const onPointerMove = (e: React.PointerEvent<HTMLDivElement>) => {
    if (longPressStartRef.current) {
      const dx = e.clientX - longPressStartRef.current.x;
      const dy = e.clientY - longPressStartRef.current.y;
      if (dx * dx + dy * dy > 25) clearLongPress();
    }
    if (!isDraggingRef.current) return;
    const wid = wordIdAtPoint(e.clientX, e.clientY);
    if (!wid) return;
    if (!pendingRef.current.has(wid)) {
      pendingRef.current.add(wid);
      dragMovedRef.current = true;
      forcePendingRender((n) => n + 1);
    } else if (
      dragStartWordRef.current &&
      wid !== dragStartWordRef.current &&
      !dragMovedRef.current
    ) {
      dragMovedRef.current = true;
    }
  };

  const finishDrag = (e: React.PointerEvent<HTMLDivElement>) => {
    clearLongPress();
    if (!isDraggingRef.current) {
      // Pointer-up after the long-press timer already cancelled the drag.
      if (longPressFiredRef.current) {
        try {
          e.currentTarget.releasePointerCapture(e.pointerId);
        } catch {
          // ignore
        }
      }
      return;
    }
    try {
      e.currentTarget.releasePointerCapture(e.pointerId);
    } catch {
      // ignore
    }
    isDraggingRef.current = false;
    const ids = Array.from(pendingRef.current);
    pendingRef.current = new Set();
    const moved = dragMovedRef.current;
    dragMovedRef.current = false;
    dragStartWordRef.current = null;
    forcePendingRender((n) => n + 1);

    if (!moved && ids.length === 1) {
      onTapWord(ids[0]);
      return;
    }
    if (ids.length > 0) onCommitDrag(ids);
  };

  return (
    <div
      onPointerDown={onPointerDown}
      onPointerMove={onPointerMove}
      onPointerUp={finishDrag}
      onPointerCancel={finishDrag}
      style={{
        touchAction: "none",
        WebkitUserSelect: "none",
        userSelect: "none",
        backgroundColor: "#FFFDF5",
        border: "1px solid #d4c9a8",
        borderRadius: 8,
        boxShadow: "0 4px 16px rgba(0,0,0,0.06)",
        aspectRatio: "1260 / 2048",
        maxWidth: 720,
        width: "100%",
        margin: "0 auto",
        padding: "32px 28px 12px",
        display: "flex",
        flexDirection: "column",
      }}
    >
      <div
        dir="rtl"
        lang="ar"
        className={fontClassName}
        style={{
          flex: 1,
          display: "flex",
          flexDirection: "column",
          justifyContent: "space-between",
          color: "#1c1917",
          fontSize: "clamp(18px, 2.6vw, 28px)",
          lineHeight: 1.15,
        }}
      >
        {page.lines.length === 0 ? (
          <p className="text-center text-sm text-stone-400">
            No words on this page.
          </p>
        ) : (
          page.lines.map((line) => (
            <div
              key={`line-${line.lineNumber}`}
              style={{
                display: "flex",
                flexDirection: "row",
                direction: "rtl",
                justifyContent: "space-between",
                alignItems: "flex-start",
                gap: 4,
              }}
            >
              {line.words.map((w) => (
                <WordSpan
                  key={w.location}
                  word={w}
                  markedCats={marksByWord.get(w.location)}
                  historicalCats={historicalByWord.get(w.location)}
                  pending={pendingRef.current.has(w.location)}
                  activeCategory={activeCategory}
                  categoryById={categoryById}
                  passesFilter={passesFilter}
                />
              ))}
            </div>
          ))
        )}
      </div>

      <div
        style={{
          marginTop: 12,
          textAlign: "center",
          fontSize: 14,
          color: "#a8a29e",
          letterSpacing: 1,
        }}
      >
        {toArabicNumerals(page.pageNumber)}
      </div>
    </div>
  );
}

function WordSpan({
  word,
  markedCats,
  historicalCats,
  pending,
  activeCategory,
  categoryById,
  passesFilter,
}: {
  word: PageWord;
  markedCats: Set<CategoryId> | undefined;
  historicalCats: Set<CategoryId> | undefined;
  pending: boolean;
  activeCategory: CategoryId;
  categoryById: Record<CategoryId, Category>;
  passesFilter: (cat: CategoryId) => boolean;
}) {
  const visibleMarked: CategoryId[] = STRIPE_ORDER.filter(
    (c) => markedCats?.has(c) && passesFilter(c),
  );
  const visibleHistorical: CategoryId[] = STRIPE_ORDER.filter(
    (c) =>
      historicalCats?.has(c) && passesFilter(c) && !markedCats?.has(c),
  );

  const showPendingStripe =
    pending && !markedCats?.has(activeCategory) && passesFilter(activeCategory);

  return (
    <span
      data-word-id={word.location}
      style={{
        display: "inline-flex",
        flexDirection: "column",
        alignItems: "stretch",
        cursor: "pointer",
        WebkitUserSelect: "none",
        userSelect: "none",
      }}
    >
      <span style={{ whiteSpace: "nowrap" }}>{word.text}</span>
      {(visibleMarked.length > 0 ||
        visibleHistorical.length > 0 ||
        showPendingStripe) && (
        <span
          aria-hidden
          style={{
            display: "flex",
            flexDirection: "column",
            gap: STRIPE_GAP,
            marginTop: 2,
          }}
        >
          {visibleMarked.map((cat) => (
            <span
              key={`m-${cat}`}
              style={{
                height: STRIPE_HEIGHT,
                borderRadius: 1,
                backgroundColor: categoryById[cat].color,
              }}
            />
          ))}
          {visibleHistorical.map((cat) => (
            <span
              key={`h-${cat}`}
              style={{
                height: STRIPE_HEIGHT,
                borderRadius: 1,
                opacity: 0.4,
                backgroundImage: `repeating-linear-gradient(45deg, ${categoryById[cat].color} 0 2px, transparent 2px 4px)`,
                backgroundColor: "transparent",
              }}
            />
          ))}
          {showPendingStripe && (
            <span
              style={{
                height: STRIPE_HEIGHT,
                borderRadius: 1,
                opacity: 0.5,
                backgroundColor: categoryById[activeCategory].color,
              }}
            />
          )}
        </span>
      )}
    </span>
  );
}
