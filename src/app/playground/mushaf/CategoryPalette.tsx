"use client";

/**
 * Color swatches for the 4 (or 2, in debug mode) mistake categories.
 */

import type { Category, CategoryId } from "./types";

type Props = {
  categories: Category[];
  activeCategory: CategoryId;
  onSelect: (id: CategoryId) => void;
  size?: "sm" | "lg";
};

export function CategoryPalette({
  categories,
  activeCategory,
  onSelect,
  size = "lg",
}: Props) {
  const isLg = size === "lg";
  const swatchSize = isLg ? 56 : 36;
  const activeSwatchSize = isLg ? 72 : 44;

  return (
    <div className="flex flex-wrap items-center gap-3">
      {categories.map((cat) => {
        const active = cat.id === activeCategory;
        const dim = active ? activeSwatchSize : swatchSize;
        return (
          <button
            key={cat.id}
            type="button"
            aria-label={cat.label}
            aria-pressed={active}
            onClick={() => onSelect(cat.id)}
            className="flex flex-col items-center gap-1 outline-none"
          >
            <span
              style={{
                width: dim,
                height: dim,
                borderRadius: "50%",
                backgroundColor: cat.color,
                border: active ? "3px solid #1c1917" : "2px solid #ffffff",
                boxShadow: active
                  ? "0 0 0 2px #ffffff, 0 2px 6px rgba(0,0,0,0.15)"
                  : "0 1px 3px rgba(0,0,0,0.12)",
                transition: "all 150ms ease",
              }}
            />
            {isLg && (
              <span
                className={`text-xs ${
                  active ? "font-medium text-stone-900" : "text-stone-500"
                }`}
              >
                {cat.label}
              </span>
            )}
          </button>
        );
      })}
    </div>
  );
}
