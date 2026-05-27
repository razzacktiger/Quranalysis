"use client";

/**
 * Long-press popover for a marked word.
 *
 * Shows the word + location header, lets the user pick a sub-category
 * (Misread / Forgot / Slipped & Corrected) per active category on the
 * word, and surfaces a mock historical count derived deterministically
 * from the word id.
 *
 * The popover is rendered as a fixed-position card anchored to the
 * word's bounding rect, placed above the word if there's room and below
 * otherwise. Tap-outside (pointerdown anywhere outside the card) closes.
 */

import { useEffect, useMemo, useRef } from "react";
import { STRIPE_ORDER } from "./samples";
import type {
  Category,
  CategoryId,
  Mark,
  SubCategory,
} from "./types";

type Props = {
  anchor: DOMRect;
  wordId: string;
  wordText: string;
  marks: Mark[];
  categories: Category[];
  onUpdateSub: (
    wordId: string,
    category: CategoryId,
    sub: SubCategory | null,
  ) => void;
  onClose: () => void;
};

const SUB_OPTIONS: { id: SubCategory; label: string }[] = [
  { id: "misread", label: "Misread" },
  { id: "forgot", label: "Forgot" },
  { id: "slipped_corrected", label: "Slipped & Corrected" },
];

const POPOVER_WIDTH = 320;
const POPOVER_GAP = 8;

/**
 * Deterministic 0-6 pseudo count from the word id, so the same word
 * always shows the same "marked X times" number across reloads.
 */
function mockHistoryCount(wordId: string): number {
  return wordId.split("").reduce((s, c) => s + c.charCodeAt(0), 0) % 7;
}

export function WordPopover({
  anchor,
  wordId,
  wordText,
  marks,
  categories,
  onUpdateSub,
  onClose,
}: Props) {
  const cardRef = useRef<HTMLDivElement | null>(null);

  const wordMarks = useMemo(
    () => marks.filter((m) => m.wordId === wordId),
    [marks, wordId],
  );

  const categoryById = useMemo(() => {
    return categories.reduce(
      (acc, c) => ({ ...acc, [c.id]: c }),
      {} as Record<CategoryId, Category>,
    );
  }, [categories]);

  // Place above if there's room, else below.
  const placement = useMemo(() => {
    if (typeof window === "undefined") {
      return { top: 0, left: 0, pointer: "below" as const };
    }
    const vh = window.innerHeight;
    const vw = window.innerWidth;
    const wantTop = anchor.top - 8;
    const placeAbove = wantTop > 240;
    let left = anchor.left + anchor.width / 2 - POPOVER_WIDTH / 2;
    left = Math.max(8, Math.min(left, vw - POPOVER_WIDTH - 8));
    const top = placeAbove
      ? Math.max(8, anchor.top - POPOVER_GAP)
      : Math.min(vh - 8, anchor.bottom + POPOVER_GAP);
    return {
      top,
      left,
      pointer: placeAbove ? ("above" as const) : ("below" as const),
    };
  }, [anchor]);

  useEffect(() => {
    const onDocPointerDown = (e: PointerEvent) => {
      if (!cardRef.current) return;
      if (cardRef.current.contains(e.target as Node)) return;
      onClose();
    };
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    document.addEventListener("pointerdown", onDocPointerDown);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("pointerdown", onDocPointerDown);
      document.removeEventListener("keydown", onKey);
    };
  }, [onClose]);

  const historyCount = mockHistoryCount(wordId);

  const transform =
    placement.pointer === "above" ? "translateY(-100%)" : "translateY(0)";

  return (
    <div
      ref={cardRef}
      role="dialog"
      aria-label={`Details for ${wordText}`}
      style={{
        position: "fixed",
        top: placement.top,
        left: placement.left,
        width: POPOVER_WIDTH,
        transform,
        zIndex: 50,
      }}
      className="rounded-xl border border-stone-200 bg-white p-3 shadow-xl"
    >
      <div className="mb-2 flex items-baseline justify-between gap-2">
        <span
          dir="rtl"
          lang="ar"
          style={{ fontSize: 22 }}
          className="font-medium text-stone-900"
        >
          {wordText}
        </span>
        <span className="font-mono text-xs text-stone-400">{wordId}</span>
      </div>

      <p className="mb-2 text-xs text-stone-500">
        Marked {historyCount}{" "}
        {historyCount === 1 ? "time" : "times"} in the last 30 days{" "}
        <span className="text-stone-300">(mock)</span>
      </p>

      {wordMarks.length === 0 ? (
        <p className="text-sm text-stone-400">No marks on this word.</p>
      ) : (
        <div className="flex flex-col gap-2">
          {STRIPE_ORDER.filter((c) =>
            wordMarks.some((m) => m.category === c),
          ).map((catId) => {
            const cat = categoryById[catId];
            const mark = wordMarks.find((m) => m.category === catId);
            const currentSub = mark?.subCategory;
            return (
              <div
                key={catId}
                className="rounded-lg border border-stone-100 bg-stone-50 p-2"
              >
                <div className="mb-1 flex items-center gap-2">
                  <span
                    aria-hidden
                    style={{
                      width: 10,
                      height: 10,
                      borderRadius: 2,
                      backgroundColor: cat.color,
                    }}
                  />
                  <span className="text-sm font-medium text-stone-700">
                    {cat.label}
                  </span>
                </div>
                <div className="flex flex-wrap gap-1.5">
                  {SUB_OPTIONS.map((opt) => {
                    const active = currentSub === opt.id;
                    return (
                      <button
                        key={opt.id}
                        type="button"
                        onClick={() =>
                          onUpdateSub(wordId, catId, active ? null : opt.id)
                        }
                        aria-pressed={active}
                        className={`rounded-full border px-2.5 py-1 text-xs transition ${
                          active
                            ? "border-stone-900 bg-stone-900 text-white"
                            : "border-stone-200 bg-white text-stone-600 hover:bg-stone-100"
                        }`}
                      >
                        {opt.label}
                      </button>
                    );
                  })}
                </div>
              </div>
            );
          })}
        </div>
      )}

      <div className="mt-3 flex justify-end">
        <button
          type="button"
          onClick={onClose}
          className="rounded-md border border-stone-200 px-3 py-1 text-xs text-stone-600 hover:bg-stone-50"
        >
          Close
        </button>
      </div>
    </div>
  );
}
