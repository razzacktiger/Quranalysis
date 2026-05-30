"use client";

/**
 * Pixel-authentic Mushaf renderer.
 *
 * Renders a pre-rendered Quran page image from the Quran Android CDN
 * (https://android.quran.com/data/width_1260/) and overlays a word-level
 * bounding-box layer for interaction. Boxes come from the exported ayahinfo
 * data (`/data/ayahinfo/page-{NNN}.json`), in the 1260x2048 SOURCE IMAGE
 * pixel space. The math is ported from the mobile repo's
 * components/mushaf/{MushafPageImage,WordHitboxOverlay}.tsx.
 *
 * This replaces the earlier HTML-span approximation (MushafView.tsx, kept for
 * reference). The marking UX is unchanged: the pointer state-machine
 * (tap vs drag vs long-press) is ported verbatim from MushafView; only the
 * "which word is under the pointer" step is swapped to coordinate hit-testing
 * (point-in-box) instead of document.elementFromPoint.
 *
 * Marks render as a translucent fill + stacked color stripes along the bottom
 * edge of each word box, preserving the established visual language.
 */

import { useEffect, useMemo, useRef, useState } from "react";
import { STRIPE_ORDER } from "./samples";
import type {
  Category,
  CategoryFilter,
  CategoryId,
  HistoricalMark,
  Mark,
} from "./types";

const SOURCE_IMAGE_WIDTH = 1260;
const SOURCE_IMAGE_HEIGHT = 2048;
const STRIPE_HEIGHT = 3;
const STRIPE_GAP = 1;

/** A single word's bounding box in SOURCE IMAGE pixel space. */
type BBoxWord = {
  /** "surah:ayah:position" — the canonical word location. */
  id: string;
  line: number;
  x: number;
  y: number;
  w: number;
  h: number;
};

type PageBoxes = {
  page: number;
  w: number;
  h: number;
  words: BBoxWord[];
};

type Props = {
  pageNumber: number;
  marks: Mark[];
  historicalMarks?: HistoricalMark[];
  activeCategory: CategoryId;
  categoryFilter: CategoryFilter;
  categories: Category[];
  onTapWord: (wordId: string) => void;
  onCommitDrag: (wordIds: string[]) => void;
  onLongPress?: (wordId: string, anchor: DOMRect) => void;
  /** When true, draws every hitbox with a faint outline to check alignment. */
  debugBoxes?: boolean;
};

// Module-level cache: page number -> parsed bbox payload. Never changes.
const pageBoxesCache = new Map<number, PageBoxes>();

function pageImageUrl(pageNumber: number): string {
  const padded = String(pageNumber).padStart(3, "0");
  return `https://android.quran.com/data/width_1260/page${padded}.png`;
}

/** Convert "#RRGGBB" + alpha (0-1) to an rgba() string. */
function hexToRgba(hex: string, alpha: number): string {
  const h = hex.replace("#", "");
  const r = parseInt(h.slice(0, 2), 16);
  const g = parseInt(h.slice(2, 4), 16);
  const b = parseInt(h.slice(4, 6), 16);
  return `rgba(${r}, ${g}, ${b}, ${alpha})`;
}

export function MushafPageView({
  pageNumber,
  marks,
  historicalMarks = [],
  activeCategory,
  categoryFilter,
  categories,
  onTapWord,
  onCommitDrag,
  onLongPress,
  debugBoxes = false,
}: Props) {
  const [boxes, setBoxes] = useState<PageBoxes | null>(
    () => pageBoxesCache.get(pageNumber) ?? null,
  );
  const [boxesError, setBoxesError] = useState<string | null>(null);
  const [imgLoaded, setImgLoaded] = useState<boolean>(false);

  const containerRef = useRef<HTMLDivElement | null>(null);
  const overlayRef = useRef<HTMLDivElement | null>(null);
  const [renderedWidth, setRenderedWidth] = useState<number>(0);

  // Pointer state-machine (ported verbatim from MushafView.tsx).
  const isDraggingRef = useRef<boolean>(false);
  const pendingRef = useRef<Set<string>>(new Set());
  const dragStartWordRef = useRef<string | null>(null);
  const dragMovedRef = useRef<boolean>(false);
  const longPressTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const longPressStartRef = useRef<{ x: number; y: number } | null>(null);
  const longPressFiredRef = useRef<boolean>(false);
  const [, forcePendingRender] = useState<number>(0);

  // Load the per-page bbox JSON (cached at module scope).
  useEffect(() => {
    const cached = pageBoxesCache.get(pageNumber);
    if (cached) {
      setBoxes(cached);
      setBoxesError(null);
      return;
    }
    let cancelled = false;
    setBoxes(null);
    setBoxesError(null);
    const padded = String(pageNumber).padStart(3, "0");
    fetch(`/data/ayahinfo/page-${padded}.json`)
      .then((r) => {
        if (!r.ok) throw new Error(`page-${padded}.json: ${r.status}`);
        return r.json() as Promise<PageBoxes>;
      })
      .then((data) => {
        pageBoxesCache.set(pageNumber, data);
        if (!cancelled) setBoxes(data);
      })
      .catch((err) => {
        if (!cancelled)
          setBoxesError(err instanceof Error ? err.message : String(err));
      });
    return () => {
      cancelled = true;
    };
  }, [pageNumber]);

  // New page -> reset the image-loaded flag so we show the loader again.
  useEffect(() => {
    setImgLoaded(false);
  }, [pageNumber]);

  // Track the rendered container width so source coords scale correctly.
  // Reason: the container has a fixed 1260/2048 aspect ratio and the image
  // fills it, so a single scale (renderedWidth / 1260) maps both axes.
  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;
    const measure = () => setRenderedWidth(el.clientWidth);
    measure();
    const ro = new ResizeObserver(measure);
    ro.observe(el);
    return () => ro.disconnect();
  }, []);

  const scale = renderedWidth > 0 ? renderedWidth / SOURCE_IMAGE_WIDTH : 0;

  const categoryById: Record<CategoryId, Category> = useMemo(() => {
    return categories.reduce(
      (acc, c) => ({ ...acc, [c.id]: c }),
      {} as Record<CategoryId, Category>,
    );
  }, [categories]);

  const marksByWord = useMemo(() => {
    const m = new Map<string, Set<CategoryId>>();
    for (const mk of marks) {
      if (!m.has(mk.wordId)) m.set(mk.wordId, new Set());
      m.get(mk.wordId)!.add(mk.category);
    }
    return m;
  }, [marks]);

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

  /**
   * Coordinate hit-test: map a client point into source-image space and find
   * the word whose box contains it. Returns the word id or null.
   */
  const wordIdAtPoint = (clientX: number, clientY: number): string | null => {
    const overlay = overlayRef.current;
    if (!overlay || !boxes || scale <= 0) return null;
    const rect = overlay.getBoundingClientRect();
    const sx = (clientX - rect.left) / scale;
    const sy = (clientY - rect.top) / scale;
    for (const word of boxes.words) {
      if (
        sx >= word.x &&
        sx <= word.x + word.w &&
        sy >= word.y &&
        sy <= word.y + word.h
      ) {
        return word.id;
      }
    }
    return null;
  };

  /** Screen-space DOMRect for a word box (for the long-press popover anchor). */
  const wordScreenRect = (word: BBoxWord): DOMRect | null => {
    const overlay = overlayRef.current;
    if (!overlay) return null;
    const rect = overlay.getBoundingClientRect();
    return new DOMRect(
      rect.left + word.x * scale,
      rect.top + word.y * scale,
      word.w * scale,
      word.h * scale,
    );
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
      const targetWid = wid;
      const targetWord = boxes?.words.find((w) => w.id === wid) ?? null;
      longPressTimerRef.current = setTimeout(() => {
        const rect = targetWord ? wordScreenRect(targetWord) : null;
        if (rect) {
          longPressFiredRef.current = true;
          onLongPress(targetWid, rect);
        }
        longPressTimerRef.current = null;
        // Cancel the in-flight drag so we don't also commit a mark.
        isDraggingRef.current = false;
        pendingRef.current = new Set();
        forcePendingRender((n) => n + 1);
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
      ref={containerRef}
      style={{
        position: "relative",
        maxWidth: 720,
        width: "100%",
        margin: "0 auto",
        aspectRatio: `${SOURCE_IMAGE_WIDTH} / ${SOURCE_IMAGE_HEIGHT}`,
        backgroundColor: "#FFFDF5",
        border: "1px solid #d4c9a8",
        borderRadius: 8,
        boxShadow: "0 4px 16px rgba(0,0,0,0.06)",
        overflow: "hidden",
      }}
    >
      {boxesError ? (
        <div className="flex h-full w-full items-center justify-center p-6 text-center text-sm text-red-600">
          Failed to load word boxes: {boxesError}
        </div>
      ) : (
        <>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            key={pageNumber}
            src={pageImageUrl(pageNumber)}
            alt={`Mushaf page ${pageNumber}`}
            onLoad={() => setImgLoaded(true)}
            draggable={false}
            style={{
              width: "100%",
              height: "100%",
              display: "block",
              objectFit: "contain",
              userSelect: "none",
            }}
          />

          {!imgLoaded && (
            <div className="absolute inset-0 flex items-center justify-center text-sm text-stone-400">
              Loading page {pageNumber}…
            </div>
          )}

          <div
            ref={overlayRef}
            onPointerDown={onPointerDown}
            onPointerMove={onPointerMove}
            onPointerUp={finishDrag}
            onPointerCancel={finishDrag}
            style={{
              position: "absolute",
              inset: 0,
              touchAction: "none",
              WebkitUserSelect: "none",
              userSelect: "none",
            }}
          >
            {boxes?.words.map((word, i) => (
              <WordBox
                key={`${word.id}-${i}`}
                word={word}
                scale={scale}
                markedCats={marksByWord.get(word.id)}
                historicalCats={historicalByWord.get(word.id)}
                pending={pendingRef.current.has(word.id)}
                activeCategory={activeCategory}
                categoryById={categoryById}
                passesFilter={passesFilter}
                debugBoxes={debugBoxes}
              />
            ))}
          </div>
        </>
      )}
    </div>
  );
}

function WordBox({
  word,
  scale,
  markedCats,
  historicalCats,
  pending,
  activeCategory,
  categoryById,
  passesFilter,
  debugBoxes,
}: {
  word: BBoxWord;
  scale: number;
  markedCats: Set<CategoryId> | undefined;
  historicalCats: Set<CategoryId> | undefined;
  pending: boolean;
  activeCategory: CategoryId;
  categoryById: Record<CategoryId, Category>;
  passesFilter: (cat: CategoryId) => boolean;
  debugBoxes: boolean;
}) {
  const visibleMarked: CategoryId[] = STRIPE_ORDER.filter(
    (c) => markedCats?.has(c) && passesFilter(c),
  );
  const visibleHistorical: CategoryId[] = STRIPE_ORDER.filter(
    (c) => historicalCats?.has(c) && passesFilter(c) && !markedCats?.has(c),
  );
  const showPending =
    pending && !markedCats?.has(activeCategory) && passesFilter(activeCategory);

  const hasContent =
    visibleMarked.length > 0 ||
    visibleHistorical.length > 0 ||
    showPending ||
    debugBoxes;
  if (!hasContent || scale <= 0) return null;

  // Fill: marked words get the top-most marked category's color at 0.18;
  // a live drag selection gets the active category at 0.10.
  let fill: string | undefined;
  if (visibleMarked.length > 0) {
    fill = hexToRgba(categoryById[visibleMarked[0]].color, 0.18);
  } else if (showPending) {
    fill = hexToRgba(categoryById[activeCategory].color, 0.1);
  }

  return (
    <div
      aria-hidden
      style={{
        position: "absolute",
        left: word.x * scale,
        top: word.y * scale,
        width: word.w * scale,
        height: word.h * scale,
        backgroundColor: fill,
        borderRadius: 2,
        outline: debugBoxes ? "1px solid rgba(59, 130, 246, 0.4)" : undefined,
        pointerEvents: "none",
      }}
    >
      <div
        style={{
          position: "absolute",
          left: 0,
          right: 0,
          bottom: 0,
          display: "flex",
          flexDirection: "column",
          gap: STRIPE_GAP,
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
        {showPending && (
          <span
            style={{
              height: STRIPE_HEIGHT,
              borderRadius: 1,
              opacity: 0.5,
              backgroundColor: categoryById[activeCategory].color,
            }}
          />
        )}
      </div>
    </div>
  );
}
