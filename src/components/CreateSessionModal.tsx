"use client";

import { useState } from "react";
import { v4 as uuidv4 } from "uuid";
import SurahSelector from "./SurahSelector";
import MistakesEditor from "./MistakesEditor";
import {
  SessionData,
  SessionFormData,
  PortionFormData,
  MistakeFormData,
  CreateSessionRequest,
  SESSION_TYPES,
  RECENCY_CATEGORIES,
} from "@/types/session";

interface CreateSessionModalProps {
  onClose: () => void;
  onSave: (sessionRequest: CreateSessionRequest) => void;
  isLoading?: boolean;
}

export default function CreateSessionModal({
  onClose,
  onSave,
  isLoading = false,
}: CreateSessionModalProps) {
  // Initialize with default values for a new session
  const [sessionData, setSessionData] = useState<
    Omit<SessionData, "id" | "user_id" | "created_at" | "updated_at">
  >({
    session_date: new Date().toISOString().slice(0, 16), // Current date/time in local format
    session_type: "reading_practice",
    duration_minutes: 15,
    performance_score: 7.0,
    session_goal: "",
    additional_notes: "",
  });

  // Initialize with one empty portion
  const [sessionPortions, setSessionPortions] = useState<PortionFormData[]>([
    {
      tempId: uuidv4(),
      surah_name: "",
      ayah_start: undefined,
      ayah_end: undefined,
      juz_number: 1,
      pages_read: 1,
      repetition_count: 1,
      recency_category: "new",
    },
  ]);

  // Initialize empty mistakes
  const [mistakes, setMistakes] = useState<MistakeFormData[]>([]);

  const [errors, setErrors] = useState<Record<string, string>>({});

  // Validation helper
  const validateForm = (): boolean => {
    const newErrors: Record<string, string> = {};

    if (!sessionData.session_type.trim()) {
      newErrors.session_type = "Session type is required";
    }
    if (sessionData.duration_minutes <= 0) {
      newErrors.duration_minutes = "Duration must be greater than 0";
    }
    if (
      sessionData.performance_score < 1 ||
      sessionData.performance_score > 10
    ) {
      newErrors.performance_score =
        "Performance score must be between 1.0-10.0";
    }

    // Validate at least one portion with a surah selected
    if (sessionPortions.length === 0) {
      newErrors.portions = "At least one surah portion is required";
    } else {
      sessionPortions.forEach((portion, index) => {
        if (!portion.surah_name.trim()) {
          newErrors[
            `portion_${index}_surah`
          ] = `Surah name is required for portion ${index + 1}`;
        }
      });
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  // Handle form submission
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (validateForm()) {
      const sessionRequest: CreateSessionRequest = {
        session: sessionData,
        session_portions: sessionPortions.map((portion) => ({
          ...portion,
          ayah_start: portion.ayah_start || 1,
          ayah_end: portion.ayah_end || 1,
          juz_number: portion.juz_number || 1, // Ensure juz_number is always set
          pages_read: portion.pages_read || 1, // Ensure pages_read is always set
          // Keep tempId for mistake mapping
          tempId: portion.tempId,
        })),
        mistakes: mistakes,
      };
      onSave(sessionRequest);
    }
  };

  // Add new portion
  const addPortion = () => {
    setSessionPortions([
      ...sessionPortions,
      {
        tempId: uuidv4(),
        surah_name: "",
        ayah_start: undefined,
        ayah_end: undefined,
        juz_number: 1,
        pages_read: 1,
        repetition_count: 1,
        recency_category: "new",
      },
    ]);
  };

  // Remove portion
  const removePortion = (tempId: string) => {
    if (sessionPortions.length > 1) {
      setSessionPortions(sessionPortions.filter((p) => p.tempId !== tempId));
      // Also remove mistakes associated with this portion (if any)
      // Note: This will be implemented when MistakesEditor is updated
    }
  };

  // Update portion data
  const updatePortion = (tempId: string, updates: Partial<PortionFormData>) => {
    setSessionPortions(
      sessionPortions.map((portion) =>
        portion.tempId === tempId ? { ...portion, ...updates } : portion
      )
    );
  };

  // Update basic session fields
  const updateSessionField = (field: keyof SessionFormData, value: any) => {
    setSessionData((prev) => ({ ...prev, [field]: value }));
  };

  // Update mistakes
  const updateMistakes = (newMistakes: MistakeFormData[]) => {
    setMistakes(newMistakes);
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-xl w-full max-w-4xl max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="sticky top-0 bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 px-6 py-4 flex justify-between items-center">
          <h2 className="text-2xl font-semibold text-gray-900 dark:text-white">
            Create New Session
          </h2>
          <button
            onClick={onClose}
            disabled={isLoading}
            className="text-gray-500 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-full p-2 transition-colors disabled:cursor-not-allowed disabled:opacity-50"
          >
            ✕
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="p-6 space-y-6">
          {/* Basic Session Info */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Date */}
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Date & Time
              </label>
              <input
                type="datetime-local"
                value={sessionData.session_date}
                onChange={(e) =>
                  updateSessionField("session_date", e.target.value)
                }
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
              />
            </div>

            {/* Session Type */}
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Session Type
              </label>
              <select
                value={sessionData.session_type}
                onChange={(e) =>
                  updateSessionField("session_type", e.target.value)
                }
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
              >
                <option value="">Select session type...</option>
                {SESSION_TYPES.map((type) => (
                  <option key={type} value={type}>
                    {type
                      .replace("_", " ")
                      .replace(/\b\w/g, (l) => l.toUpperCase())}
                  </option>
                ))}
              </select>
              {errors.session_type && (
                <p className="text-red-500 text-sm mt-1">
                  {errors.session_type}
                </p>
              )}
            </div>

            {/* Duration */}
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Duration (minutes)
              </label>
              <input
                type="number"
                min="1"
                value={sessionData.duration_minutes}
                onChange={(e) =>
                  updateSessionField(
                    "duration_minutes",
                    parseInt(e.target.value) || 0
                  )
                }
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
              />
              {errors.duration_minutes && (
                <p className="text-red-500 text-sm mt-1">
                  {errors.duration_minutes}
                </p>
              )}
            </div>

            {/* Performance Score */}
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Performance Score (1.0-10.0)
              </label>
              <input
                type="number"
                min="1"
                max="10"
                step="0.1"
                value={sessionData.performance_score}
                onChange={(e) =>
                  updateSessionField(
                    "performance_score",
                    parseFloat(e.target.value) || 1
                  )
                }
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
              />
              {errors.performance_score && (
                <p className="text-red-500 text-sm mt-1">
                  {errors.performance_score}
                </p>
              )}
            </div>
          </div>

          {/* Surah Portions */}
          <div className="border-t border-gray-200 dark:border-gray-700 pt-4">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-medium text-gray-900 dark:text-white">
                Surah Portions ({sessionPortions.length})
              </h3>
              <button
                type="button"
                onClick={addPortion}
                className="px-3 py-1 bg-emerald-600 text-white rounded-md hover:bg-emerald-700 transition-colors text-sm"
              >
                + Add Surah
              </button>
            </div>

            {errors.portions && (
              <p className="text-red-500 text-sm mb-4">{errors.portions}</p>
            )}

            <div className="space-y-6">
              {sessionPortions.map((portion, index) => (
                <div
                  key={portion.tempId}
                  className="bg-gray-50 dark:bg-gray-700 p-4 rounded-lg"
                >
                  <div className="flex justify-between items-center mb-4">
                    <h4 className="font-medium text-gray-900 dark:text-white">
                      Portion {index + 1}
                    </h4>
                    {sessionPortions.length > 1 && (
                      <button
                        type="button"
                        onClick={() => removePortion(portion.tempId)}
                        className="text-red-600 hover:text-red-700 text-sm"
                      >
                        Remove
                      </button>
                    )}
                  </div>

                  <SurahSelector
                    surahName={portion.surah_name}
                    ayahStart={portion.ayah_start}
                    ayahEnd={portion.ayah_end}
                    onSurahChange={(surahName) => {
                      // When surah changes, just update the surah name
                      updatePortion(portion.tempId, {
                        surah_name: surahName,
                      });
                    }}
                    onAyahStartChange={(ayahStart) => {
                      // Only update if we have a valid value (not undefined from automatic reset)
                      if (ayahStart !== undefined) {
                        updatePortion(portion.tempId, {
                          ayah_start: ayahStart,
                        });
                      }
                    }}
                    onAyahEndChange={(ayahEnd) => {
                      // Only update if we have a valid value (not undefined from automatic reset)
                      if (ayahEnd !== undefined) {
                        updatePortion(portion.tempId, {
                          ayah_end: ayahEnd,
                        });
                      }
                    }}
                    onJuzChange={(juzNumber) =>
                      updatePortion(portion.tempId, {
                        juz_number: juzNumber || 1,
                      })
                    }
                    onPagesChange={(pagesRead) =>
                      updatePortion(portion.tempId, {
                        pages_read: pagesRead || 1,
                      })
                    }
                    error={errors[`portion_${index}_surah`]}
                  />

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
                    {/* Repetition Count */}
                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                        Repetition Count
                      </label>
                      <input
                        type="number"
                        min="1"
                        value={portion.repetition_count}
                        onChange={(e) =>
                          updatePortion(portion.tempId, {
                            repetition_count: parseInt(e.target.value) || 1,
                          })
                        }
                        className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
                      />
                    </div>

                    {/* Recency Category */}
                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                        Recency Category
                      </label>
                      <select
                        value={portion.recency_category}
                        onChange={(e) =>
                          updatePortion(portion.tempId, {
                            recency_category: e.target.value as any,
                          })
                        }
                        className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
                      >
                        {RECENCY_CATEGORIES.map((category) => (
                          <option key={category} value={category}>
                            {category.charAt(0).toUpperCase() +
                              category.slice(1)}
                          </option>
                        ))}
                      </select>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Session Goal */}
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Session Goal
            </label>
            <textarea
              value={sessionData.session_goal || ""}
              onChange={(e) =>
                updateSessionField("session_goal", e.target.value)
              }
              rows={2}
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 resize-none"
              placeholder="What do you want to focus on in this session?"
            />
          </div>

          {/* Additional Notes */}
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Additional Notes
            </label>
            <textarea
              value={sessionData.additional_notes || ""}
              onChange={(e) =>
                updateSessionField("additional_notes", e.target.value)
              }
              rows={2}
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 resize-none"
              placeholder="Any additional observations or notes..."
            />
          </div>

          {/* Mistakes Section */}
          <div className="border-t border-gray-200 dark:border-gray-700 pt-4">
            <MistakesEditor
              mistakes={mistakes}
              sessionPortions={sessionPortions}
              onChange={updateMistakes}
            />
          </div>

          {/* Action Buttons */}
          <div className="flex justify-end space-x-3 pt-4 border-t border-gray-200 dark:border-gray-700">
            <button
              type="button"
              onClick={onClose}
              disabled={isLoading}
              className="px-6 py-2 border border-gray-300 dark:border-gray-600 rounded-md text-gray-700 dark:text-gray-300 bg-white dark:bg-gray-700 hover:bg-gray-50 dark:hover:bg-gray-600 focus:outline-none focus:ring-2 focus:ring-emerald-500 disabled:bg-gray-100 dark:disabled:bg-gray-600 disabled:cursor-not-allowed"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isLoading}
              className="px-6 py-2 bg-emerald-600 text-white rounded-md hover:bg-emerald-700 focus:outline-none focus:ring-2 focus:ring-emerald-500 disabled:bg-emerald-400 disabled:cursor-not-allowed"
            >
              {isLoading ? "Creating..." : "Create Session"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
