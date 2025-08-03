"use client";

import { useState, useEffect } from "react";
import {
  SURAHS_COMPLETE as SURAHS,
  SurahInfo,
  validateAyahRange,
  getJuzFromSurahAyah,
  getJuzRange,
} from "@/data/surahs-complete";
import {
  calculateCommunityPagesRead,
  getCommunityPageFromAyah,
} from "@/data/community-page-mapping";

interface SurahSelectorProps {
  surahName: string;
  ayahStart?: number;
  ayahEnd?: number;
  onSurahChange: (surahName: string) => void;
  onAyahStartChange: (ayahStart: number | undefined) => void;
  onAyahEndChange: (ayahEnd: number | undefined) => void;
  onJuzChange?: (juzNumber: number | undefined) => void;
  onPagesChange?: (pagesRead: number | undefined) => void;
  error?: string;
}

export default function SurahSelector({
  surahName,
  ayahStart,
  ayahEnd,
  onSurahChange,
  onAyahStartChange,
  onAyahEndChange,
  onJuzChange,
  onPagesChange,
  error,
}: SurahSelectorProps) {
  const [selectedSurah, setSelectedSurah] = useState<SurahInfo | null>(null);
  const [ayahError, setAyahError] = useState<string>("");

  // Find selected surah when surahName changes
  useEffect(() => {
    if (surahName) {
      const surah = SURAHS.find((s) => s.name === surahName);
      setSelectedSurah(surah || null);
    } else {
      setSelectedSurah(null);
    }
  }, [surahName]);

  // Validate ayah range and auto-calculate juz/pages
  useEffect(() => {
    if (selectedSurah && ayahStart && ayahEnd) {
      // Validate ayah range
      if (!validateAyahRange(selectedSurah.number, ayahStart, ayahEnd)) {
        setAyahError(
          `Invalid range. ${selectedSurah.name} has ${selectedSurah.totalAyahs} ayahs.`
        );
        return;
      } else {
        setAyahError("");
      }

      // Auto-calculate juz number
      const juzNumber = getJuzFromSurahAyah(selectedSurah.number, ayahStart);
      onJuzChange?.(juzNumber);

      // Auto-calculate pages using authoritative community data
      const pagesRead = calculateCommunityPagesRead(
        selectedSurah.number,
        ayahStart,
        ayahEnd
      );
      onPagesChange?.(pagesRead);
    } else {
      setAyahError("");
      onJuzChange?.(undefined);
      onPagesChange?.(undefined);
    }
  }, [selectedSurah, ayahStart, ayahEnd]); // Removed function dependencies to prevent infinite loop

  const handleSurahSelect = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const selectedName = e.target.value;
    onSurahChange(selectedName);

    // Reset ayah ranges when surah changes
    onAyahStartChange(undefined);
    onAyahEndChange(undefined);
  };

  const handleAyahStartChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = parseInt(e.target.value) || undefined;
    onAyahStartChange(value);
  };

  const handleAyahEndChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = parseInt(e.target.value) || undefined;
    onAyahEndChange(value);
  };

  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
      {/* Surah Selection */}
      <div className="md:col-span-1">
        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
          Surah
        </label>
        <select
          value={surahName}
          onChange={handleSurahSelect}
          className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
        >
          <option value="">Select Surah...</option>
          {SURAHS.map((surah) => (
            <option key={surah.number} value={surah.name}>
              {surah.number}. {surah.name} ({surah.arabicName}) -{" "}
              {surah.totalAyahs} ayahs
            </option>
          ))}
        </select>
        {error && <p className="text-red-500 text-sm mt-1">{error}</p>}
      </div>

      {/* Ayah Start */}
      <div>
        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
          Starting Ayah
        </label>
        <input
          type="number"
          min="1"
          max={selectedSurah?.totalAyahs || 999}
          value={ayahStart || ""}
          onChange={handleAyahStartChange}
          disabled={!selectedSurah}
          placeholder={
            selectedSurah
              ? `1-${selectedSurah.totalAyahs}`
              : "Select surah first"
          }
          className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 disabled:bg-gray-100 dark:disabled:bg-gray-600 disabled:cursor-not-allowed"
        />
      </div>

      {/* Ayah End */}
      <div>
        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
          Ending Ayah
        </label>
        <input
          type="number"
          min={ayahStart || 1}
          max={selectedSurah?.totalAyahs || 999}
          value={ayahEnd || ""}
          onChange={handleAyahEndChange}
          disabled={!selectedSurah || !ayahStart}
          placeholder={
            selectedSurah && ayahStart
              ? `${ayahStart}-${selectedSurah.totalAyahs}`
              : "Enter start first"
          }
          className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 disabled:bg-gray-100 dark:disabled:bg-gray-600 disabled:cursor-not-allowed"
        />
        {ayahError && <p className="text-red-500 text-sm mt-1">{ayahError}</p>}
      </div>

      {/* Auto-calculated info display */}
      {selectedSurah && ayahStart && ayahEnd && !ayahError && (
        <div className="md:col-span-3 mt-2 p-3 bg-emerald-50 dark:bg-emerald-900/20 rounded-lg border border-emerald-200 dark:border-emerald-800">
          <div className="flex flex-wrap gap-4 text-sm text-emerald-700 dark:text-emerald-300">
            <span>
              📖 <strong>Range:</strong> {ayahEnd - ayahStart + 1} ayahs
            </span>
            <span>
              📚 <strong>Juz:</strong>{" "}
              {(() => {
                const juzRange = getJuzRange(
                  selectedSurah.number,
                  ayahStart,
                  ayahEnd
                );
                return juzRange.startJuz === juzRange.endJuz
                  ? juzRange.startJuz
                  : `${juzRange.startJuz}-${juzRange.endJuz}`;
              })()}
            </span>
            <span>
              📄 <strong>Pages:</strong>{" "}
              {calculateCommunityPagesRead(
                selectedSurah.number,
                ayahStart,
                ayahEnd
              )}
            </span>
            <span>
              🏛️ <strong>Revelation:</strong> {selectedSurah.revelation}
            </span>
          </div>
        </div>
      )}
    </div>
  );
}
