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
 */

import { useMemo, useRef, useState } from "react";
import { toArabicNumerals, type PageData } from "./data/pageIndex";
import type { Category, CategoryId, Mark } from "./types";

type Props = {
  page: PageData;
  marks: Mark[];
  activeCategory: CategoryId;
  categories: Category[];
  fontClassName: string;
  onTapWord: (wordId: string) => void;
  onCommitDrag: (wordIds: string[]) => void;
};

function hexToRgba(hex: string, alpha: number): string {
  const v = hex.replace("#", "");
  const r = parseInt(v.slice(0, 2), 16);
  const g = parseInt(v.slice(2, 4), 16);
  const b = parseInt(v.slice(4, 6), 16);
  return `rgba(${r},${g},${b},${alpha})`;
}

export function MushafView({
  page,
  marks,
  activeCategory,
  categories,
  fontClassName,
  onTapWord,
  onCommitDrag,
}: Props) {
  const isDraggingRef = useRef<boolean>(false);
  const pendingRef = useRef<Set<string>>(new Set());
  const dragStartWordRef = useRef<string | null>(null);
  const dragMovedRef = useRef<boolean>(false);
  const [, forcePendingRender] = useState<number>(0);

  const categoryById: Record<CategoryId, Category> = useMemo(() => {
    return categories.reduce(
      (acc, c) => ({ ...acc, [c.id]: c }),
      {} as Record<CategoryId, Category>,
    );
  }, [categories]);

  const markByWordId: Map<string, Mark> = useMemo(() => {
    const m = new Map<string, Mark>();
    for (const mk of marks) m.set(mk.wordId, mk);
    return m;
  }, [marks]);

  const activeColor = categoryById[activeCategory]?.color ?? "#000";

  const wordIdAtPoint = (x: number, y: number): string | null => {
    const el = document.elementFromPoint(x, y) as HTMLElement | null;
    if (!el) return null;
    const wid = el.closest<HTMLElement>("[data-word-id]")?.dataset.wordId;
    return wid ?? null;
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
    pendingRef.current = new Set<string>([wid]);
    forcePendingRender((n) => n + 1);
  };

  const onPointerMove = (e: React.PointerEvent<HTMLDivElement>) => {
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
    if (!isDraggingRef.current) return;
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
                alignItems: "baseline",
                gap: 4,
              }}
            >
              {line.words.map((w) => {
                const mark = markByWordId.get(w.location);
                const isPending = pendingRef.current.has(w.location);
                let bg: string | undefined;
                if (mark) {
                  const c = categoryById[mark.category]?.color ?? activeColor;
                  bg = hexToRgba(c, 0.4);
                } else if (isPending) {
                  bg = hexToRgba(activeColor, 0.25);
                }
                return (
                  <span
                    key={w.location}
                    data-word-id={w.location}
                    style={{
                      backgroundColor: bg,
                      padding: bg ? "1px 3px" : 0,
                      borderRadius: 4,
                      cursor: "pointer",
                      WebkitUserSelect: "none",
                      userSelect: "none",
                      whiteSpace: "nowrap",
                    }}
                  >
                    {w.text}
                  </span>
                );
              })}
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
