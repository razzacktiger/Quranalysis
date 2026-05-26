"use client";

/**
 * Renders a passage as RTL Arabic word spans. Handles:
 *   - Tap-to-mark (via onClick on word spans)
 *   - Drag-select across words (via pointer events on the wrapper)
 *
 * Reason: We use `document.elementFromPoint` + `data-word-id` rather than
 * computing geometry ourselves. Cheaper to implement and good enough for a
 * prototype.
 */

import { useMemo, useRef, useState } from "react";
import type { Category, CategoryId, Mark, Passage } from "./types";

type Props = {
  passage: Passage;
  marks: Mark[];
  activeCategory: CategoryId;
  categories: Category[];
  fontClassName: string;
  onTapWord: (wordId: string) => void;
  onCommitDrag: (wordIds: string[]) => void;
};

/** "rgba(R,G,B,a)" from a hex color. Tolerates only #RRGGBB. */
function hexToRgba(hex: string, alpha: number): string {
  const v = hex.replace("#", "");
  const r = parseInt(v.slice(0, 2), 16);
  const g = parseInt(v.slice(2, 4), 16);
  const b = parseInt(v.slice(4, 6), 16);
  return `rgba(${r},${g},${b},${alpha})`;
}

export function MushafView({
  passage,
  marks,
  activeCategory,
  categories,
  fontClassName,
  onTapWord,
  onCommitDrag,
}: Props) {
  const containerRef = useRef<HTMLDivElement | null>(null);
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
    // Reason: only handle primary pointer (mouse left button or touch).
    if (e.button !== 0 && e.pointerType === "mouse") return;
    const wid = wordIdAtPoint(e.clientX, e.clientY);
    if (!wid) return;
    try {
      e.currentTarget.setPointerCapture(e.pointerId);
    } catch {
      // ignore — some browsers throw if already captured
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
      // Treat as a tap — let the parent toggle behavior fire.
      onTapWord(ids[0]);
      return;
    }
    if (ids.length > 0) onCommitDrag(ids);
  };

  return (
    <div
      ref={containerRef}
      onPointerDown={onPointerDown}
      onPointerMove={onPointerMove}
      onPointerUp={finishDrag}
      onPointerCancel={finishDrag}
      style={{
        touchAction: "none",
        WebkitUserSelect: "none",
        userSelect: "none",
      }}
      className="rounded-2xl bg-white/60 px-6 py-8 shadow-sm ring-1 ring-stone-200"
    >
      <div
        dir="rtl"
        lang="ar"
        className={`${fontClassName} text-right leading-[2.6]`}
        style={{ fontSize: 30, color: "#1c1917" }}
      >
        {passage.ayahs.map((ayah) => (
          <span key={`ayah-${ayah.number}`}>
            {ayah.words.map((w) => {
              const mark = markByWordId.get(w.id);
              const isPending = pendingRef.current.has(w.id);
              let bg: string | undefined;
              if (mark) {
                const c = categoryById[mark.category]?.color ?? activeColor;
                bg = hexToRgba(c, 0.4);
              } else if (isPending) {
                bg = hexToRgba(activeColor, 0.25);
              }
              return (
                <span
                  key={w.id}
                  data-word-id={w.id}
                  style={{
                    backgroundColor: bg,
                    padding: bg ? "2px 4px" : 0,
                    borderRadius: 6,
                    margin: "0 2px",
                    display: "inline-block",
                    cursor: "pointer",
                    WebkitUserSelect: "none",
                    userSelect: "none",
                  }}
                >
                  {w.text}
                </span>
              );
            })}
            <span
              aria-label={`end of ayah ${ayah.number}`}
              style={{
                display: "inline-block",
                margin: "0 6px",
                fontSize: 22,
                color: "#a8a29e",
              }}
            >
              ﴿{toArabicDigits(ayah.number)}﴾
            </span>
          </span>
        ))}
      </div>
    </div>
  );
}

function toArabicDigits(n: number): string {
  const map = ["٠", "١", "٢", "٣", "٤", "٥", "٦", "٧", "٨", "٩"];
  return String(n)
    .split("")
    .map((d) => map[Number(d)] ?? d)
    .join("");
}
