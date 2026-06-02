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
import { alignPageWordBoxes, isRubMarkId } from "./data/alignPageBoxes";
import { normalizePageBoxes } from "./data/normalizeBoxes";
import type { PageWord } from "./data/pageIndex";
import {
  boxIntersectsRect,
  classifyDecorationGlyph,
  fillAyahPositionGaps,
  isRealWord,
  isWaqfGlyph,
  resolvePointHit,
} from "./data/wordIndex";
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
  /** pages-index words for this page — drives id→bbox alignment. */
  indexWords?: PageWord[];
  marks: Mark[];
  historicalMarks?: HistoricalMark[];
  activeCategory: CategoryId;
  categoryFilter: CategoryFilter;
  categories: Category[];
  onTapWord: (wordIds: string[]) => void;
  onCommitDrag: (wordIds: string[]) => void;
  onLongPress?: (wordId: string, anchor: DOMRect) => void;
  /** When true, draws every hitbox with a faint outline to check alignment. */
  debugBoxes?: boolean;
  /** Fired on each pointer commit for ?debug=1 inspection. */
  onHitDebug?: (info: HitDebugInfo) => void;
};

export type HitDebugInfo = {
  pageNumber: number;
  mode: "tap" | "drag";
  hitCount: number;
  firstId: string;
  lastId: string;
  ayahKey: string | null;
  ayahTotal: number | null;
  /** pause-mark vs word vs full-ayah */
  hitKind: "word" | "waqf" | "full-ayah";
};

// Module-level cache: normalized raw ayahinfo (before index alignment).
const rawPageBoxesCache = new Map<number, PageBoxes>();

function normalizeRawPageBoxes(data: PageBoxes): PageBoxes {
  return { ...data, words: normalizePageBoxes(data.words) };
}

function alignWithIndex(
  data: PageBoxes,
  indexWords: PageWord[],
  debugBoxes: boolean,
): PageBoxes {
  if (indexWords.length === 0) return data;
  return {
    ...data,
    words: alignPageWordBoxes(indexWords, data.words, {
      includeRubDecor: debugBoxes,
    }),
  };
}

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
  indexWords = [],
  marks,
  historicalMarks = [],
  activeCategory,
  categoryFilter,
  categories,
  onTapWord,
  onCommitDrag,
  onLongPress,
  debugBoxes = false,
  onHitDebug,
}: Props) {
  const [boxes, setBoxes] = useState<PageBoxes | null>(null);
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
  /** Full-ayah ids from marker / rub tap — preserved for the whole gesture. */
  const lockedAyahIdsRef = useRef<string[] | null>(null);
  const dragRectRef = useRef<{
    x1: number;
    y1: number;
    x2: number;
    y2: number;
  } | null>(null);
  const longPressTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const longPressStartRef = useRef<{ x: number; y: number } | null>(null);
  const longPressFiredRef = useRef<boolean>(false);
  const [, forcePendingRender] = useState<number>(0);

  // Load ayahinfo bboxes and align with pages-index word ids.
  useEffect(() => {
    let cancelled = false;

    const applyBoxes = (raw: PageBoxes) => {
      if (!cancelled) setBoxes(alignWithIndex(raw, indexWords, debugBoxes));
    };

    const cached = rawPageBoxesCache.get(pageNumber);
    if (cached) {
      applyBoxes(cached);
      setBoxesError(null);
      return () => {
        cancelled = true;
      };
    }

    setBoxes(null);
    setBoxesError(null);
    const padded = String(pageNumber).padStart(3, "0");
    fetch(`/data/ayahinfo/page-${padded}.json?v=2`)
      .then((r) => {
        if (!r.ok) throw new Error(`page-${padded}.json: ${r.status}`);
        return r.json() as Promise<PageBoxes>;
      })
      .then((data) => {
        const normalized = normalizeRawPageBoxes(data);
        rawPageBoxesCache.set(pageNumber, normalized);
        applyBoxes(normalized);
      })
      .catch((err) => {
        if (!cancelled)
          setBoxesError(err instanceof Error ? err.message : String(err));
      });

    return () => {
      cancelled = true;
    };
  }, [pageNumber, indexWords, debugBoxes]);

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

  const sourcePoint = (clientX: number, clientY: number) => {
    const overlay = overlayRef.current;
    if (!overlay || scale <= 0) return null;
    const rect = overlay.getBoundingClientRect();
    return {
      sx: (clientX - rect.left) / scale,
      sy: (clientY - rect.top) / scale,
    };
  };

  /**
   * Resolve a screen point to markable word ids (ayah markers, rub ۞ zones,
   * and real words). Parent must gate rendering until initWordIndex() completes.
   */
  const wordIdsAtPoint = (clientX: number, clientY: number): string[] => {
    if (!boxes) return [];
    const pt = sourcePoint(clientX, clientY);
    if (!pt) return [];
    return resolvePointHit(boxes.words, pt.sx, pt.sy);
  };

  /** All real words on this page whose bbox overlaps the drag rectangle. */
  const wordIdsInDragRect = (
    x1: number,
    y1: number,
    x2: number,
    y2: number,
  ): string[] => {
    if (!boxes) return [];
    const ids = boxes.words
      .filter(
        (w) =>
          isRealWord(w.id) &&
          boxIntersectsRect(w, x1, y1, x2, y2),
      )
      .map((w) => w.id);
    return fillAyahPositionGaps(
      ids,
      boxes.words.filter((w) => isRealWord(w.id)).map((w) => w.id),
    );
  };

  const reportHitDebug = (mode: "tap" | "drag", ids: string[]) => {
    if (!onHitDebug || ids.length === 0) return;
    const sorted = [...ids].sort((a, b) => {
      const pa = a.split(":").map(Number);
      const pb = b.split(":").map(Number);
      for (let i = 0; i < 3; i++) {
        if (pa[i] !== pb[i]) return pa[i] - pb[i];
      }
      return 0;
    });
    const first = sorted[0];
    const last = sorted[sorted.length - 1];
    const ayahKey = first.split(":").slice(0, 2).join(":");
    const box = boxes?.words.find((w) => w.id === first);
    const hitKind: HitDebugInfo["hitKind"] =
      ids.length > 1
        ? "full-ayah"
        : isRealWord(first)
          ? "word"
          : box && isWaqfGlyph(first, box)
            ? "waqf"
            : "word";
    onHitDebug({
      pageNumber,
      mode,
      hitCount: ids.length,
      firstId: first,
      lastId: last,
      ayahKey: ids.length > 1 ? ayahKey : null,
      ayahTotal: ids.length > 1 ? ids.length : null,
      hitKind,
    });
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
    const pt = sourcePoint(e.clientX, e.clientY);
    if (!pt) return;
    const ids = wordIdsAtPoint(e.clientX, e.clientY);
    if (ids.length === 0) return;
    try {
      e.currentTarget.setPointerCapture(e.pointerId);
    } catch {
      // ignore
    }
    isDraggingRef.current = true;
    dragStartWordRef.current = ids[0];
    dragMovedRef.current = false;
    longPressFiredRef.current = false;
    lockedAyahIdsRef.current = ids.length > 1 ? ids : null;
    dragRectRef.current = {
      x1: pt.sx,
      y1: pt.sy,
      x2: pt.sx,
      y2: pt.sy,
    };
    pendingRef.current = new Set(ids);
    forcePendingRender((n) => n + 1);

    const markedId = ids.find((id) => marksByWord.has(id));
    if (onLongPress && markedId) {
      longPressStartRef.current = { x: e.clientX, y: e.clientY };
      const hitId = ids[0];
      const targetWord =
        boxes?.words.find((w) => w.id === markedId) ??
        boxes?.words.find((w) => w.id === hitId) ??
        null;
      longPressTimerRef.current = setTimeout(() => {
        const rect = targetWord ? wordScreenRect(targetWord) : null;
        if (rect) {
          longPressFiredRef.current = true;
          onLongPress(markedId, rect);
        }
        longPressTimerRef.current = null;
        // Cancel the in-flight drag so we don't also commit a mark.
        isDraggingRef.current = false;
        pendingRef.current = new Set();
        lockedAyahIdsRef.current = null;
        dragRectRef.current = null;
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

    const pt = sourcePoint(e.clientX, e.clientY);
    if (!pt) return;

    if (lockedAyahIdsRef.current) {
      // Ayah-marker / rub-el-hizb seed — keep the full ayah set for the gesture.
      dragRectRef.current = {
        x1: Math.min(dragRectRef.current?.x1 ?? pt.sx, pt.sx),
        y1: Math.min(dragRectRef.current?.y1 ?? pt.sy, pt.sy),
        x2: Math.max(dragRectRef.current?.x2 ?? pt.sx, pt.sx),
        y2: Math.max(dragRectRef.current?.y2 ?? pt.sy, pt.sy),
      };
      if (
        dragRectRef.current.x2 - dragRectRef.current.x1 > 3 ||
        dragRectRef.current.y2 - dragRectRef.current.y1 > 3
      ) {
        dragMovedRef.current = true;
      }
      return;
    }

    const rect = dragRectRef.current ?? {
      x1: pt.sx,
      y1: pt.sy,
      x2: pt.sx,
      y2: pt.sy,
    };
    rect.x2 = pt.sx;
    rect.y2 = pt.sy;
    dragRectRef.current = rect;

    const rectIds = wordIdsInDragRect(rect.x1, rect.y1, rect.x2, rect.y2);
    if (rectIds.length === 0) return;

    pendingRef.current = new Set(rectIds);
    dragMovedRef.current = true;
    forcePendingRender((n) => n + 1);
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
    const ids = lockedAyahIdsRef.current
      ? lockedAyahIdsRef.current
      : Array.from(pendingRef.current);
    pendingRef.current = new Set();
    lockedAyahIdsRef.current = null;
    dragRectRef.current = null;
    const moved = dragMovedRef.current;
    dragMovedRef.current = false;
    dragStartWordRef.current = null;
    forcePendingRender((n) => n + 1);

    if (!moved) {
      reportHitDebug("tap", ids);
      onTapWord(ids);
      return;
    }
    if (ids.length > 0) {
      reportHitDebug("drag", ids);
      onCommitDrag(ids);
    }
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
            {boxes?.words.map((word, i) => {
              const isWord = isRealWord(word.id);
              const isRub = isRubMarkId(word.id);
              const isWaqf = !isWord && !isRub && isWaqfGlyph(word.id, word);
              const isAyahEnd =
                !isWord &&
                !isRub &&
                !isWaqf &&
                classifyDecorationGlyph(word.id, word) === "ayah-end";
              const hasMark =
                marksByWord.has(word.id) || pendingRef.current.has(word.id);

              if (isAyahEnd && !debugBoxes) return null;
              if (isWaqf && !hasMark && !debugBoxes) return null;
              if (!isWord && !isWaqf && !isRub && !debugBoxes) return null;

              return (
                <WordBox
                  key={`${word.id}-${i}`}
                  word={word}
                  scale={scale}
                  glyphKind={
                    isWord ? "word" : isRub ? "rub" : isWaqf ? "waqf" : "ayah-end"
                  }
                  isRubStart={isRub}
                  rubDecorOnly={isRub}
                  markedCats={marksByWord.get(word.id)}
                  historicalCats={historicalByWord.get(word.id)}
                  pending={pendingRef.current.has(word.id)}
                  activeCategory={activeCategory}
                  categoryById={categoryById}
                  passesFilter={passesFilter}
                  debugBoxes={debugBoxes}
                />
              );
            })}
          </div>
        </>
      )}
    </div>
  );
}

function WordBox({
  word,
  scale,
  glyphKind,
  isRubStart,
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
  glyphKind: "word" | "waqf" | "rub" | "ayah-end";
  isRubStart: boolean;
  /** ۞ outline for debug — not selectable, does not select ayah. */
  rubDecorOnly?: boolean;
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
  if (!hasContent || scale <= 0 || word.w <= 0 || word.h <= 0) return null;

  const boxLeft = word.x * scale;
  const boxWidth = word.w * scale;

  if (rubDecorOnly) {
    return (
      <div
        aria-hidden
        title="Rub el hizb (۞) — decorative, not selectable"
        style={{
          position: "absolute",
          left: boxLeft,
          top: word.y * scale,
          width: boxWidth,
          height: word.h * scale,
          pointerEvents: "none",
          outline: "1px solid rgba(168, 85, 247, 0.65)",
          boxSizing: "border-box",
        }}
      />
    );
  }

  // Fill: marked words get the top-most marked category's color at 0.18;
  // a live drag selection gets the active category at 0.10.
  let fill: string | undefined;
  if (visibleMarked.length > 0) {
    fill = hexToRgba(
      categoryById[visibleMarked[0]].color,
      glyphKind === "waqf" ? 0.35 : 0.18,
    );
  } else if (showPending) {
    fill = hexToRgba(
      categoryById[activeCategory].color,
      glyphKind === "waqf" ? 0.25 : 0.1,
    );
  }

  const debugOutline =
    glyphKind === "waqf"
      ? "1px dashed rgba(168, 85, 247, 0.65)"
      : glyphKind === "ayah-end"
        ? "1px dashed rgba(234, 88, 12, 0.55)"
        : glyphKind === "rub"
          ? "1px solid rgba(168, 85, 247, 0.65)"
          : "1px solid rgba(59, 130, 246, 0.4)";

  const debugTitle = debugBoxes ? word.id : undefined;

  return (
    <div
      aria-hidden
      title={debugTitle}
      style={{
        position: "absolute",
        left: boxLeft,
        top: word.y * scale,
        width: boxWidth,
        height: word.h * scale,
        backgroundColor: fill,
        borderRadius: glyphKind === "waqf" ? 3 : 2,
        outline: debugBoxes ? debugOutline : undefined,
        pointerEvents: "none",
      }}
    >
      <div
        style={{
          position: "absolute",
          left: 0,
          right: 0,
          // Stack stripes just BELOW the word box (in the line gap) so they
          // never overlap the glyph. There is room under each Mushaf line.
          top: "100%",
          marginTop: 1,
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
