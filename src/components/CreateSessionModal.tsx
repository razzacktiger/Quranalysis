"use client";

import { useState } from "react";
import MistakesEditor from "./MistakesEditor";

// Reusing interfaces from EditSessionModal for consistency
interface Mistake {
  id: string;
  errorCategory: string;
  errorSubcategory?: string;
  severityLevel: number; // 1-5
  location: string;
  additionalNotes?: string;
}

interface PortionDetails {
  surahName: string;
  ayahStart?: number;
  ayahEnd?: number;
  juzNumber?: number;
  pagesRead?: number;
  recencyCategory: "new" | "recent" | "reviewing" | "maintenance";
}

interface NewSession {
  id: string;
  date: string;
  sessionType: string;
  duration: number;
  performanceScore: number;
  portionDetails: PortionDetails;
  sessionGoal?: string;
  additionalNotes?: string;
  mistakes: Mistake[];
}

interface CreateSessionModalProps {
  onClose: () => void;
  onSave: (newSession: NewSession) => void;
  isLoading?: boolean;
}

export default function CreateSessionModal({
  onClose,
  onSave,
  isLoading = false,
}: CreateSessionModalProps) {
  // Initialize with default values for a new session
  const [formData, setFormData] = useState<NewSession>({
    id: `temp-${Date.now()}`, // Temporary ID, will be replaced by backend
    date: new Date().toISOString().slice(0, 16), // Current date/time in local format
    sessionType: "reading_practice",
    duration: 15,
    performanceScore: 7,
    portionDetails: {
      surahName: "",
      ayahStart: 1,
      ayahEnd: 1,
      juzNumber: 1,
      pagesRead: 1,
      recencyCategory: "new",
    },
    sessionGoal: "",
    additionalNotes: "",
    mistakes: [],
  });

  const [errors, setErrors] = useState<Record<string, string>>({});

  // Validation helper
  const validateForm = (): boolean => {
    const newErrors: Record<string, string> = {};

    if (!formData.sessionType.trim()) {
      newErrors.sessionType = "Session type is required";
    }
    if (formData.duration <= 0) {
      newErrors.duration = "Duration must be greater than 0";
    }
    if (formData.performanceScore < 1 || formData.performanceScore > 10) {
      newErrors.performanceScore = "Performance score must be between 1.0-10.0";
    }
    if (!formData.portionDetails.surahName.trim()) {
      newErrors.surahName = "Surah name is required";
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  // Handle form submission
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (validateForm()) {
      onSave(formData);
      onClose();
    }
  };

  // Update basic form fields
  const updateField = (field: keyof NewSession, value: any) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  };

  // Update portion details
  const updatePortionField = (field: keyof PortionDetails, value: any) => {
    setFormData((prev) => ({
      ...prev,
      portionDetails: {
        ...prev.portionDetails,
        [field]: value,
      },
    }));
  };

  // Update mistakes
  const updateMistakes = (newMistakes: Mistake[]) => {
    updateField("mistakes", newMistakes);
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
                value={formData.date}
                onChange={(e) => updateField("date", e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
              />
            </div>

            {/* Session Type */}
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Session Type
              </label>
              <select
                value={formData.sessionType}
                onChange={(e) => updateField("sessionType", e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
              >
                <option value="">Select session type...</option>
                <option value="reading_practice">
                  Reading Practice (from book)
                </option>
                <option value="memorization">
                  Memorization (reciting from memory)
                </option>
                <option value="audit">
                  Audit (memory test without review)
                </option>
                <option value="mistake_session">
                  Mistake Session (focused error correction)
                </option>
                <option value="practice_test">
                  Practice Test (formal recitation)
                </option>
                <option value="study_session">
                  Study Session (meaning, tafseer)
                </option>
              </select>
              {errors.sessionType && (
                <p className="text-red-500 text-sm mt-1">
                  {errors.sessionType}
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
                value={formData.duration}
                onChange={(e) =>
                  updateField("duration", parseInt(e.target.value) || 0)
                }
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
              />
              {errors.duration && (
                <p className="text-red-500 text-sm mt-1">{errors.duration}</p>
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
                value={formData.performanceScore}
                onChange={(e) =>
                  updateField(
                    "performanceScore",
                    parseFloat(e.target.value) || 1
                  )
                }
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
              />
              {errors.performanceScore && (
                <p className="text-red-500 text-sm mt-1">
                  {errors.performanceScore}
                </p>
              )}
            </div>
          </div>

          {/* Portion Details */}
          <div className="border-t border-gray-200 dark:border-gray-700 pt-4">
            <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-4">
              Portion Details
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {/* Surah Name */}
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Surah Name
                </label>
                <input
                  type="text"
                  value={formData.portionDetails.surahName}
                  onChange={(e) =>
                    updatePortionField("surahName", e.target.value)
                  }
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
                  placeholder="e.g., Al-Fatiha"
                />
                {errors.surahName && (
                  <p className="text-red-500 text-sm mt-1">
                    {errors.surahName}
                  </p>
                )}
              </div>

              {/* Ayah Start */}
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Starting Ayah
                </label>
                <input
                  type="number"
                  min="1"
                  value={formData.portionDetails.ayahStart || ""}
                  onChange={(e) =>
                    updatePortionField(
                      "ayahStart",
                      parseInt(e.target.value) || undefined
                    )
                  }
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
                />
              </div>

              {/* Ayah End */}
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Ending Ayah
                </label>
                <input
                  type="number"
                  min="1"
                  value={formData.portionDetails.ayahEnd || ""}
                  onChange={(e) =>
                    updatePortionField(
                      "ayahEnd",
                      parseInt(e.target.value) || undefined
                    )
                  }
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
                />
              </div>

              {/* Juz Number */}
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Juz Number
                </label>
                <input
                  type="number"
                  min="1"
                  max="30"
                  value={formData.portionDetails.juzNumber || ""}
                  onChange={(e) =>
                    updatePortionField(
                      "juzNumber",
                      parseInt(e.target.value) || undefined
                    )
                  }
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
                />
              </div>

              {/* Pages Read */}
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Pages Read
                </label>
                <input
                  type="number"
                  min="1"
                  value={formData.portionDetails.pagesRead || ""}
                  onChange={(e) =>
                    updatePortionField(
                      "pagesRead",
                      parseInt(e.target.value) || undefined
                    )
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
                  value={formData.portionDetails.recencyCategory}
                  onChange={(e) =>
                    updatePortionField("recencyCategory", e.target.value)
                  }
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
                >
                  <option value="new">New</option>
                  <option value="recent">Recent</option>
                  <option value="reviewing">Reviewing</option>
                  <option value="maintenance">Maintenance</option>
                </select>
              </div>
            </div>
          </div>

          {/* Session Goal */}
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Session Goal
            </label>
            <textarea
              value={formData.sessionGoal || ""}
              onChange={(e) => updateField("sessionGoal", e.target.value)}
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
              value={formData.additionalNotes || ""}
              onChange={(e) => updateField("additionalNotes", e.target.value)}
              rows={2}
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 resize-none"
              placeholder="Any additional observations or notes..."
            />
          </div>

          {/* Mistakes Section */}
          <div className="border-t border-gray-200 dark:border-gray-700 pt-4">
            <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-4">
              Mistakes
            </h3>
            <MistakesEditor
              mistakes={formData.mistakes}
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
