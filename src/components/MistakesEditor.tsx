"use client";

interface Mistake {
  id: string;
  errorCategory: string;
  errorSubcategory?: string;
  severityLevel: number; // 1-5
  location: string;
  additionalNotes?: string;
}

interface MistakesEditorProps {
  mistakes: Mistake[];
  onChange: (mistakes: Mistake[]) => void;
}

export default function MistakesEditor({
  mistakes,
  onChange,
}: MistakesEditorProps) {
  // Add new mistake
  const addMistake = () => {
    const newMistake: Mistake = {
      id: `mistake-${Date.now()}`,
      errorCategory: "",
      errorSubcategory: "",
      severityLevel: 1,
      location: "",
      additionalNotes: "",
    };
    onChange([...mistakes, newMistake]);
  };

  // Update mistake
  const updateMistake = (index: number, field: keyof Mistake, value: any) => {
    const newMistakes = [...mistakes];
    newMistakes[index] = { ...newMistakes[index], [field]: value };
    onChange(newMistakes);
  };

  // Remove mistake
  const removeMistake = (index: number) => {
    onChange(mistakes.filter((_, i) => i !== index));
  };

  // Get severity color
  const getSeverityColor = (level: number) => {
    if (level <= 2) return "text-green-600 dark:text-green-400";
    if (level <= 3) return "text-yellow-600 dark:text-yellow-400";
    return "text-red-600 dark:text-red-400";
  };

  // Error categories from database enum
  const errorCategories = [
    "pronunciation", // Makhraj (articulation points)
    "tajweed", // Tajweed rules (ghunna, qalqalah, etc.)
    "memorization", // Memory-related errors
    "translation", // Translation/meaning related errors
    "fluency", // Flow and rhythm issues
    "waqf", // Stopping and starting rules
    "other", // Other errors
  ];

  // Error subcategories from database enum (grouped by category)
  const errorSubcategories = {
    pronunciation: ["makhraj", "sifat"],
    tajweed: ["ghunna", "qalqalah", "madd", "idgham", "ikhfa", "iqlab"],
    memorization: [
      "word_order",
      "verse_skip",
      "word_substitution",
      "mutashabih",
      "forgotten_word",
      "forgotten_verse_start",
      "forgotten_verse_end",
      "forgotten_verse_middle",
      "forgotten_verse_all",
      "forgotten_verse_middle_end",
      "forgotten_verse_start_middle",
      "verse_slipping",
    ],
    fluency: ["hesitation", "repetition", "rhythm"],
    waqf: [
      "wrong_stop",
      "missed_stop",
      "disencouraged_stop",
      "disencouraged_continue",
    ],
    translation: [], // No specific subcategories yet
    other: [], // No specific subcategories
  };

  // Helper function to format enum values for display
  const formatEnumValue = (value: string) => {
    return value
      .split("_")
      .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
      .join(" ");
  };

  // All 114 Surah names with their ayah counts
  const surahData = [
    { name: "Al-Fatiha", ayahs: 7 },
    { name: "Al-Baqarah", ayahs: 286 },
    { name: "Ali Imran", ayahs: 200 },
    { name: "An-Nisa", ayahs: 176 },
    { name: "Al-Maidah", ayahs: 120 },
    { name: "Al-Anam", ayahs: 165 },
    { name: "Al-Araf", ayahs: 206 },
    { name: "Al-Anfal", ayahs: 75 },
    { name: "At-Tawbah", ayahs: 129 },
    { name: "Yunus", ayahs: 109 },
    { name: "Hud", ayahs: 123 },
    { name: "Yusuf", ayahs: 111 },
    { name: "Ar-Rad", ayahs: 43 },
    { name: "Ibrahim", ayahs: 52 },
    { name: "Al-Hijr", ayahs: 99 },
    { name: "An-Nahl", ayahs: 128 },
    { name: "Al-Isra", ayahs: 111 },
    { name: "Al-Kahf", ayahs: 110 },
    { name: "Maryam", ayahs: 98 },
    { name: "Taha", ayahs: 135 },
    { name: "Al-Anbiya", ayahs: 112 },
    { name: "Al-Hajj", ayahs: 78 },
    { name: "Al-Muminun", ayahs: 118 },
    { name: "An-Nur", ayahs: 64 },
    { name: "Al-Furqan", ayahs: 77 },
    { name: "Ash-Shuara", ayahs: 227 },
    { name: "An-Naml", ayahs: 93 },
    { name: "Al-Qasas", ayahs: 88 },
    { name: "Al-Ankabut", ayahs: 69 },
    { name: "Ar-Rum", ayahs: 60 },
    { name: "Luqman", ayahs: 34 },
    { name: "As-Sajdah", ayahs: 30 },
    { name: "Al-Ahzab", ayahs: 73 },
    { name: "Saba", ayahs: 54 },
    { name: "Fatir", ayahs: 45 },
    { name: "Ya-Sin", ayahs: 83 },
    { name: "As-Saffat", ayahs: 182 },
    { name: "Sad", ayahs: 88 },
    { name: "Az-Zumar", ayahs: 75 },
    { name: "Ghafir", ayahs: 85 },
    { name: "Fussilat", ayahs: 54 },
    { name: "Ash-Shuraa", ayahs: 53 },
    { name: "Az-Zukhruf", ayahs: 89 },
    { name: "Ad-Dukhan", ayahs: 59 },
    { name: "Al-Jathiyah", ayahs: 37 },
    { name: "Al-Ahqaf", ayahs: 35 },
    { name: "Muhammad", ayahs: 38 },
    { name: "Al-Fath", ayahs: 29 },
    { name: "Al-Hujurat", ayahs: 18 },
    { name: "Qaf", ayahs: 45 },
    { name: "Adh-Dhariyat", ayahs: 60 },
    { name: "At-Tur", ayahs: 49 },
    { name: "An-Najm", ayahs: 62 },
    { name: "Al-Qamar", ayahs: 55 },
    { name: "Ar-Rahman", ayahs: 78 },
    { name: "Al-Waqiah", ayahs: 96 },
    { name: "Al-Hadid", ayahs: 29 },
    { name: "Al-Mujadila", ayahs: 22 },
    { name: "Al-Hashr", ayahs: 24 },
    { name: "Al-Mumtahanah", ayahs: 13 },
    { name: "As-Saff", ayahs: 14 },
    { name: "Al-Jumuah", ayahs: 11 },
    { name: "Al-Munafiqun", ayahs: 11 },
    { name: "At-Taghabun", ayahs: 18 },
    { name: "At-Talaq", ayahs: 12 },
    { name: "At-Tahrim", ayahs: 12 },
    { name: "Al-Mulk", ayahs: 30 },
    { name: "Al-Qalam", ayahs: 52 },
    { name: "Al-Haqqah", ayahs: 52 },
    { name: "Al-Maarij", ayahs: 44 },
    { name: "Nuh", ayahs: 28 },
    { name: "Al-Jinn", ayahs: 28 },
    { name: "Al-Muzzammil", ayahs: 20 },
    { name: "Al-Muddaththir", ayahs: 56 },
    { name: "Al-Qiyamah", ayahs: 40 },
    { name: "Al-Insan", ayahs: 31 },
    { name: "Al-Mursalat", ayahs: 50 },
    { name: "An-Naba", ayahs: 40 },
    { name: "An-Naziat", ayahs: 46 },
    { name: "Abasa", ayahs: 42 },
    { name: "At-Takwir", ayahs: 29 },
    { name: "Al-Infitar", ayahs: 19 },
    { name: "Al-Mutaffifin", ayahs: 36 },
    { name: "Al-Inshiqaq", ayahs: 25 },
    { name: "Al-Buruj", ayahs: 22 },
    { name: "At-Tariq", ayahs: 17 },
    { name: "Al-Ala", ayahs: 19 },
    { name: "Al-Ghashiyah", ayahs: 26 },
    { name: "Al-Fajr", ayahs: 30 },
    { name: "Al-Balad", ayahs: 20 },
    { name: "Ash-Shams", ayahs: 15 },
    { name: "Al-Layl", ayahs: 21 },
    { name: "Ad-Duhaa", ayahs: 11 },
    { name: "Ash-Sharh", ayahs: 8 },
    { name: "At-Tin", ayahs: 8 },
    { name: "Al-Alaq", ayahs: 19 },
    { name: "Al-Qadr", ayahs: 5 },
    { name: "Al-Bayyinah", ayahs: 8 },
    { name: "Az-Zalzalah", ayahs: 8 },
    { name: "Al-Adiyat", ayahs: 11 },
    { name: "Al-Qariah", ayahs: 11 },
    { name: "At-Takathur", ayahs: 8 },
    { name: "Al-Asr", ayahs: 3 },
    { name: "Al-Humazah", ayahs: 9 },
    { name: "Al-Fil", ayahs: 5 },
    { name: "Quraysh", ayahs: 4 },
    { name: "Al-Maun", ayahs: 7 },
    { name: "Al-Kawthar", ayahs: 3 },
    { name: "Al-Kafirun", ayahs: 6 },
    { name: "An-Nasr", ayahs: 3 },
    { name: "Al-Masad", ayahs: 5 },
    { name: "Al-Ikhlas", ayahs: 4 },
    { name: "Al-Falaq", ayahs: 5 },
    { name: "An-Nas", ayahs: 6 },
  ];

  // Get max ayahs for a surah
  const getMaxAyahs = (surahName: string): number => {
    const surah = surahData.find((s) => s.name === surahName);
    return surah?.ayahs || 1;
  };

  // Parse location string to get surah and ayah
  const parseLocation = (location: string) => {
    // Try to match "Surah verse Number" format first
    const verseMatch = location.match(/^(.+?)\s+(?:verse|ayah)\s+(\d+)$/i);
    if (verseMatch) {
      return { surah: verseMatch[1].trim(), ayah: parseInt(verseMatch[2]) };
    }

    // If no verse number, treat as just surah name
    if (location.trim()) {
      return { surah: location.trim(), ayah: null };
    }

    return { surah: "", ayah: null };
  };

  // Update location field with structured data
  const updateLocationField = (
    index: number,
    surah: string,
    ayah: number | null
  ) => {
    let location = "";

    if (surah && ayah) {
      // Both surah and ayah provided
      location = `${surah} verse ${ayah}`;
    } else if (surah) {
      // Only surah provided (preserve surah when ayah is cleared)
      location = surah;
    }
    // If neither provided, location stays empty

    updateMistake(index, "location", location);
  };

  return (
    <div className="border-t border-gray-200 dark:border-gray-700 pt-6">
      <div className="flex justify-between items-center mb-4">
        <h3 className="text-lg font-medium text-gray-900 dark:text-white">
          Mistakes ({mistakes.length})
        </h3>
        <button
          type="button"
          onClick={addMistake}
          className="px-3 py-1 bg-emerald-600 text-white text-sm rounded-md hover:bg-emerald-700 transition-colors"
        >
          + Add Mistake
        </button>
      </div>

      {mistakes.length === 0 ? (
        <div className="text-center py-8 text-gray-500 dark:text-gray-400 bg-gray-50 dark:bg-gray-700 rounded-lg">
          <p>No mistakes recorded for this session</p>
          <p className="text-sm mt-1">
            Click "Add Mistake" to record any errors
          </p>
        </div>
      ) : (
        <div className="space-y-4">
          {mistakes.map((mistake, index) => (
            <div
              key={mistake.id}
              className="border border-gray-200 dark:border-gray-600 rounded-lg p-4 bg-gray-50 dark:bg-gray-700"
            >
              <div className="flex justify-between items-start mb-3">
                <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
                  Mistake #{index + 1}
                </span>
                <button
                  type="button"
                  onClick={() => removeMistake(index)}
                  className="text-red-500 hover:text-red-700 dark:hover:text-red-400 text-sm font-medium"
                >
                  Remove
                </button>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                {/* Error Category */}
                <div>
                  <label className="block text-xs font-medium text-gray-600 dark:text-gray-400 mb-1">
                    Error Category
                  </label>
                  <select
                    value={mistake.errorCategory}
                    onChange={(e) => {
                      // Update both category and clear subcategory in single update
                      const newMistakes = [...mistakes];
                      newMistakes[index] = {
                        ...newMistakes[index],
                        errorCategory: e.target.value,
                        errorSubcategory: "", // Clear subcategory when category changes
                      };
                      onChange(newMistakes);
                    }}
                    className="w-full px-2 py-1 text-sm border border-gray-300 dark:border-gray-500 rounded bg-white dark:bg-gray-600 text-gray-900 dark:text-white focus:ring-1 focus:ring-emerald-500 focus:border-emerald-500"
                  >
                    <option value="">Select category...</option>
                    {errorCategories.map((category) => (
                      <option key={category} value={category}>
                        {formatEnumValue(category)}
                      </option>
                    ))}
                  </select>
                </div>

                {/* Error Subcategory */}
                <div>
                  <label className="block text-xs font-medium text-gray-600 dark:text-gray-400 mb-1">
                    Subcategory
                    {!mistake.errorCategory && (
                      <span className="text-xs text-amber-500 ml-1">
                        (select category first)
                      </span>
                    )}
                  </label>
                  {mistake.errorCategory ? (
                    errorSubcategories[
                      mistake.errorCategory as keyof typeof errorSubcategories
                    ]?.length > 0 ? (
                      <select
                        value={mistake.errorSubcategory || ""}
                        onChange={(e) =>
                          updateMistake(
                            index,
                            "errorSubcategory",
                            e.target.value
                          )
                        }
                        className="w-full px-2 py-1 text-sm border border-gray-300 dark:border-gray-500 rounded bg-white dark:bg-gray-600 text-gray-900 dark:text-white focus:ring-1 focus:ring-emerald-500 focus:border-emerald-500"
                      >
                        <option value="">Select subcategory...</option>
                        {errorSubcategories[
                          mistake.errorCategory as keyof typeof errorSubcategories
                        ].map((subcategory) => (
                          <option key={subcategory} value={subcategory}>
                            {formatEnumValue(subcategory)}
                          </option>
                        ))}
                      </select>
                    ) : (
                      <input
                        type="text"
                        value={mistake.errorSubcategory || ""}
                        onChange={(e) =>
                          updateMistake(
                            index,
                            "errorSubcategory",
                            e.target.value
                          )
                        }
                        placeholder="Enter custom subcategory..."
                        className="w-full px-2 py-1 text-sm border border-gray-300 dark:border-gray-500 rounded bg-white dark:bg-gray-600 text-gray-900 dark:text-white focus:ring-1 focus:ring-emerald-500 focus:border-emerald-500"
                      />
                    )
                  ) : (
                    <div className="w-full px-2 py-1 text-sm border border-gray-300 dark:border-gray-500 rounded bg-gray-100 dark:bg-gray-700 text-gray-400 dark:text-gray-500">
                      Select error category first
                    </div>
                  )}
                </div>

                {/* Severity Level */}
                <div>
                  <label className="block text-xs font-medium text-gray-600 dark:text-gray-400 mb-1">
                    Severity Level
                  </label>
                  <select
                    value={mistake.severityLevel}
                    onChange={(e) =>
                      updateMistake(
                        index,
                        "severityLevel",
                        parseInt(e.target.value)
                      )
                    }
                    className={`w-full px-2 py-1 text-sm border border-gray-300 dark:border-gray-500 rounded bg-white dark:bg-gray-600 font-medium focus:ring-1 focus:ring-emerald-500 focus:border-emerald-500 ${getSeverityColor(
                      mistake.severityLevel
                    )}`}
                  >
                    <option value={1}>1 - Minor</option>
                    <option value={2}>2 - Small</option>
                    <option value={3}>3 - Moderate</option>
                    <option value={4}>4 - Significant</option>
                    <option value={5}>5 - Major</option>
                  </select>
                </div>

                {/* Location - Surah */}
                <div>
                  <label className="block text-xs font-medium text-gray-600 dark:text-gray-400 mb-1">
                    Surah
                  </label>
                  <select
                    value={parseLocation(mistake.location).surah}
                    onChange={(e) => {
                      const currentAyah = parseLocation(mistake.location).ayah;
                      updateLocationField(index, e.target.value, currentAyah);
                    }}
                    className="w-full px-2 py-1 text-sm border border-gray-300 dark:border-gray-500 rounded bg-white dark:bg-gray-600 text-gray-900 dark:text-white focus:ring-1 focus:ring-emerald-500 focus:border-emerald-500"
                  >
                    <option value="">Select surah...</option>
                    {surahData.map((surah) => (
                      <option key={surah.name} value={surah.name}>
                        {surah.name} ({surah.ayahs} ayahs)
                      </option>
                    ))}
                  </select>
                </div>

                {/* Location - Ayah */}
                <div>
                  <label className="block text-xs font-medium text-gray-600 dark:text-gray-400 mb-1">
                    Ayah/Verse
                    {parseLocation(mistake.location).surah && (
                      <span className="text-xs text-gray-500 ml-1">
                        (1-{getMaxAyahs(parseLocation(mistake.location).surah)})
                      </span>
                    )}
                  </label>
                  <input
                    type="number"
                    min="1"
                    max={
                      parseLocation(mistake.location).surah
                        ? getMaxAyahs(parseLocation(mistake.location).surah)
                        : undefined
                    }
                    value={parseLocation(mistake.location).ayah || ""}
                    onChange={(e) => {
                      const currentSurah = parseLocation(
                        mistake.location
                      ).surah;

                      // Handle empty field (user backspaced/cleared)
                      if (e.target.value === "") {
                        updateLocationField(index, currentSurah, null);
                        return;
                      }

                      const ayah = parseInt(e.target.value);
                      const maxAyahs = getMaxAyahs(currentSurah);

                      // Validate ayah is a valid number and within range
                      if (isNaN(ayah) || ayah < 1 || ayah > maxAyahs) {
                        return; // Don't update if invalid
                      }

                      updateLocationField(index, currentSurah, ayah);
                    }}
                    placeholder={
                      parseLocation(mistake.location).surah
                        ? "Verse number"
                        : "Select surah first"
                    }
                    disabled={!parseLocation(mistake.location).surah}
                    className="w-full px-2 py-1 text-sm border border-gray-300 dark:border-gray-500 rounded bg-white dark:bg-gray-600 text-gray-900 dark:text-white focus:ring-1 focus:ring-emerald-500 focus:border-emerald-500 disabled:opacity-50"
                  />
                </div>
              </div>

              {/* Additional Notes */}
              <div className="mt-3">
                <label className="block text-xs font-medium text-gray-600 dark:text-gray-400 mb-1">
                  Additional Notes
                </label>
                <textarea
                  value={mistake.additionalNotes || ""}
                  onChange={(e) =>
                    updateMistake(index, "additionalNotes", e.target.value)
                  }
                  placeholder="Any additional details about this mistake..."
                  rows={2}
                  className="w-full px-2 py-1 text-sm border border-gray-300 dark:border-gray-500 rounded bg-white dark:bg-gray-600 text-gray-900 dark:text-white focus:ring-1 focus:ring-emerald-500 focus:border-emerald-500"
                />
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
