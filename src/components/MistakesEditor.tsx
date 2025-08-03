"use client";

import { MistakeFormData, PortionFormData, ErrorCategory, ErrorSubcategory } from "@/types/session";

interface MistakesEditorProps {
  mistakes: MistakeFormData[];
  sessionPortions: PortionFormData[]; // Available portions to link mistakes to
  onChange: (mistakes: MistakeFormData[]) => void;
}

export default function MistakesEditor({
  mistakes,
  sessionPortions,
  onChange,
}: MistakesEditorProps) {
  // Add new mistake
  const addMistake = () => {
    const newMistake: MistakeFormData = {
      tempId: `mistake-${Date.now()}`,
      portionTempId: sessionPortions.length > 0 ? sessionPortions[0].tempId : "",
      error_category: "pronunciation",
      error_subcategory: undefined,
      severity_level: 1,
      ayah_number: 1,
      additional_notes: "",
    };
    onChange([...mistakes, newMistake]);
  };

  // Update mistake
  const updateMistake = (index: number, field: keyof MistakeFormData, value: any) => {
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
  const errorCategories: ErrorCategory[] = [
    "pronunciation", // Makhraj (articulation points)
    "tajweed", // Tajweed rules (ghunna, qalqalah, etc.)
    "memorization", // Memory-related errors
    "translation", // Translation/meaning related errors
    "fluency", // Flow and rhythm issues
    "waqf", // Stopping and starting rules
    "other", // Other errors
  ];

  // Error subcategories from database enum (grouped by category)
  const errorSubcategories: Record<ErrorCategory, ErrorSubcategory[]> = {
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

  // Get the selected portion for a mistake
  const getSelectedPortion = (portionTempId: string) => {
    return sessionPortions.find(portion => portion.tempId === portionTempId) || null;
  };

  // Validate ayah number against portion range
  const validateAyahNumber = (ayahNumber: number, portionTempId: string) => {
    const portion = getSelectedPortion(portionTempId);
    if (!portion || !portion.ayah_start || !portion.ayah_end) return false;
    return ayahNumber >= portion.ayah_start && ayahNumber <= portion.ayah_end;
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
          {mistakes.map((mistake, index) => {
            const selectedPortion = getSelectedPortion(mistake.portionTempId);
            
            return (
              <div
                key={mistake.tempId}
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
                  {/* Portion Selection */}
                  <div>
                    <label className="block text-xs font-medium text-gray-600 dark:text-gray-400 mb-1">
                      Portion
                    </label>
                    <select
                      value={mistake.portionTempId}
                      onChange={(e) => {
                        const newPortionTempId = e.target.value;
                        const newPortion = getSelectedPortion(newPortionTempId);
                        
                        // Update both portion and ayah number
                        const newMistakes = [...mistakes];
                        newMistakes[index] = {
                          ...newMistakes[index],
                          portionTempId: newPortionTempId,
                          ayah_number: newPortion?.ayah_start || 1, // Reset to start of new portion
                        };
                        onChange(newMistakes);
                      }}
                      className="w-full px-2 py-1 text-sm border border-gray-300 dark:border-gray-500 rounded bg-white dark:bg-gray-600 text-gray-900 dark:text-white focus:ring-1 focus:ring-emerald-500 focus:border-emerald-500"
                    >
                      {sessionPortions.map((portion) => (
                        <option key={portion.tempId} value={portion.tempId}>
                          {portion.surah_name} ({portion.ayah_start}-
                          {portion.ayah_end})
                        </option>
                      ))}
                    </select>
                  </div>

                  {/* Ayah Number */}
                  <div>
                    <label className="block text-xs font-medium text-gray-600 dark:text-gray-400 mb-1">
                      Ayah Number
                      {selectedPortion && selectedPortion.ayah_start && selectedPortion.ayah_end && (
                        <span className="text-xs text-gray-500 ml-1">
                          ({selectedPortion.ayah_start}-
                          {selectedPortion.ayah_end})
                        </span>
                      )}
                    </label>
                    <input
                      type="number"
                      min={selectedPortion?.ayah_start || 1}
                      max={selectedPortion?.ayah_end || 1}
                      value={mistake.ayah_number}
                      onChange={(e) => {
                        const ayah = parseInt(e.target.value);
                        if (!isNaN(ayah) && selectedPortion && selectedPortion.ayah_start && selectedPortion.ayah_end) {
                          const validAyah = Math.max(
                            selectedPortion.ayah_start,
                            Math.min(selectedPortion.ayah_end, ayah)
                          );
                          updateMistake(index, "ayah_number", validAyah);
                        }
                      }}
                      placeholder="Ayah number"
                      disabled={!selectedPortion}
                      className="w-full px-2 py-1 text-sm border border-gray-300 dark:border-gray-500 rounded bg-white dark:bg-gray-600 text-gray-900 dark:text-white focus:ring-1 focus:ring-emerald-500 focus:border-emerald-500 disabled:opacity-50"
                    />
                  </div>

                  {/* Error Category */}
                  <div>
                    <label className="block text-xs font-medium text-gray-600 dark:text-gray-400 mb-1">
                      Error Category
                    </label>
                    <select
                      value={mistake.error_category}
                      onChange={(e) => {
                        // Update both category and clear subcategory in single update
                        const newMistakes = [...mistakes];
                        newMistakes[index] = {
                          ...newMistakes[index],
                          error_category: e.target.value as ErrorCategory,
                          error_subcategory: undefined, // Clear subcategory when category changes
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
                      {!mistake.error_category && (
                        <span className="text-xs text-amber-500 ml-1">
                          (select category first)
                        </span>
                      )}
                    </label>
                    {mistake.error_category ? (
                      errorSubcategories[mistake.error_category]?.length > 0 ? (
                        <select
                          value={mistake.error_subcategory || ""}
                          onChange={(e) =>
                            updateMistake(
                              index,
                              "error_subcategory",
                              e.target.value || undefined
                            )
                          }
                          className="w-full px-2 py-1 text-sm border border-gray-300 dark:border-gray-500 rounded bg-white dark:bg-gray-600 text-gray-900 dark:text-white focus:ring-1 focus:ring-emerald-500 focus:border-emerald-500"
                        >
                          <option value="">Select subcategory...</option>
                          {errorSubcategories[mistake.error_category].map((subcategory) => (
                            <option key={subcategory} value={subcategory}>
                              {formatEnumValue(subcategory)}
                            </option>
                          ))}
                        </select>
                      ) : (
                        <input
                          type="text"
                          value={mistake.error_subcategory || ""}
                          onChange={(e) =>
                            updateMistake(
                              index,
                              "error_subcategory",
                              e.target.value || undefined
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
                      value={mistake.severity_level}
                      onChange={(e) =>
                        updateMistake(
                          index,
                          "severity_level",
                          parseInt(e.target.value)
                        )
                      }
                      className={`w-full px-2 py-1 text-sm border border-gray-300 dark:border-gray-500 rounded bg-white dark:bg-gray-600 font-medium focus:ring-1 focus:ring-emerald-500 focus:border-emerald-500 ${getSeverityColor(
                        mistake.severity_level
                      )}`}
                    >
                      <option value={1}>1 - Minor</option>
                      <option value={2}>2 - Small</option>
                      <option value={3}>3 - Moderate</option>
                      <option value={4}>4 - Significant</option>
                      <option value={5}>5 - Major</option>
                    </select>
                  </div>
                </div>

                {/* Additional Notes */}
                <div className="mt-3">
                  <label className="block text-xs font-medium text-gray-600 dark:text-gray-400 mb-1">
                    Additional Notes
                  </label>
                  <textarea
                    value={mistake.additional_notes || ""}
                    onChange={(e) =>
                      updateMistake(index, "additional_notes", e.target.value)
                    }
                    placeholder="Any additional details about this mistake..."
                    rows={2}
                    className="w-full px-2 py-1 text-sm border border-gray-300 dark:border-gray-500 rounded bg-white dark:bg-gray-600 text-gray-900 dark:text-white focus:ring-1 focus:ring-emerald-500 focus:border-emerald-500"
                  />
                </div>

                {/* Validation Warning */}
                {selectedPortion &&
                  !validateAyahNumber(
                    mistake.ayah_number,
                    mistake.portionTempId
                  ) && (
                    <div className="mt-2 p-2 bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 rounded text-amber-700 dark:text-amber-300 text-xs">
                      ⚠️ Ayah number {mistake.ayah_number} is outside the range
                      for {selectedPortion.surah_name} (
                      {selectedPortion.ayah_start}-{selectedPortion.ayah_end})
                    </div>
                  )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
