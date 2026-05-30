"use client";

/**
 * Floating debug panel — only mounted when `?debug=1` is on the URL.
 *
 * Toggles palette size (4 / 2) and counting mode (per-mark / per-range) to
 * let the user feel what each variant is like.
 */

import type { CountingMode, PaletteSize } from "./types";

type Props = {
  paletteSize: PaletteSize;
  setPaletteSize: (n: PaletteSize) => void;
  countingMode: CountingMode;
  setCountingMode: (m: CountingMode) => void;
  sheetDurationMs: number;
  setSheetDurationMs: (n: number) => void;
  sheetEasing: string;
  setSheetEasing: (s: string) => void;
};

const EASINGS = ["linear", "ease", "ease-in", "ease-out", "ease-in-out"];

export function DebugPanel({
  paletteSize,
  setPaletteSize,
  countingMode,
  setCountingMode,
  sheetDurationMs,
  setSheetDurationMs,
  sheetEasing,
  setSheetEasing,
}: Props) {
  return (
    <aside
      aria-label="Debug panel"
      className="fixed right-4 top-4 z-40 w-60 rounded-xl border border-stone-200 bg-white/95 p-3 shadow-lg backdrop-blur"
    >
      <p className="mb-2 text-[10px] uppercase tracking-wider text-stone-400">
        Debug
      </p>

      <div className="space-y-3">
        <div>
          <p className="mb-1 text-xs font-medium text-stone-600">
            Palette size
          </p>
          <div className="flex gap-1">
            {([4, 2] as PaletteSize[]).map((n) => {
              const active = paletteSize === n;
              return (
                <button
                  key={n}
                  type="button"
                  onClick={() => setPaletteSize(n)}
                  className={`flex-1 rounded-md px-2 py-1 text-xs transition ${
                    active
                      ? "bg-stone-900 text-white"
                      : "bg-stone-100 text-stone-600 hover:bg-stone-200"
                  }`}
                >
                  {n} colors
                </button>
              );
            })}
          </div>
        </div>

        <div>
          <p className="mb-1 text-xs font-medium text-stone-600">
            Counting mode
          </p>
          <div className="flex gap-1">
            {(["per-mark", "per-range"] as CountingMode[]).map((m) => {
              const active = countingMode === m;
              return (
                <button
                  key={m}
                  type="button"
                  onClick={() => setCountingMode(m)}
                  className={`flex-1 rounded-md px-2 py-1 text-xs transition ${
                    active
                      ? "bg-stone-900 text-white"
                      : "bg-stone-100 text-stone-600 hover:bg-stone-200"
                  }`}
                >
                  {m}
                </button>
              );
            })}
          </div>
        </div>

        <div>
          <div className="mb-1 flex items-center justify-between">
            <p className="text-xs font-medium text-stone-600">Sheet speed</p>
            <span className="text-[10px] text-stone-400">{sheetDurationMs}ms</span>
          </div>
          <input
            type="range"
            min={100}
            max={500}
            step={50}
            value={sheetDurationMs}
            onChange={(e) => setSheetDurationMs(Number(e.target.value))}
            className="w-full accent-stone-900"
            aria-label="Sheet transition duration"
          />
        </div>

        <div>
          <p className="mb-1 text-xs font-medium text-stone-600">Easing</p>
          <select
            value={sheetEasing}
            onChange={(e) => setSheetEasing(e.target.value)}
            className="w-full rounded-md border border-stone-200 bg-white px-2 py-1 text-xs text-stone-700"
            aria-label="Sheet transition easing"
          >
            {EASINGS.map((e) => (
              <option key={e} value={e}>
                {e}
              </option>
            ))}
          </select>
        </div>
      </div>
    </aside>
  );
}
