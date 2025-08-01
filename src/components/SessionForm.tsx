"use client";

import { useState, useEffect } from "react";

interface MistakeData {
  id: string;
  error_category: string;
  error_subcategory: string;
  location: string;
  details: string;
  severity_level: number;
}

interface SessionFormData {
  session_type: string;
  timestamp: string; // ISO datetime string
  duration: number | null;
  performance_score: number | null;
  notes: string;
  goal_description: string;
  // Portion details
  surah_name: string;
  juz_number: number | null;
  ayah_start: number | null;
  ayah_end: number | null;
  pages_read: number | null;
  recency_category: string;
  // Mistakes
  mistakes: MistakeData[];
}

interface SurahOption {
  value: string;
  label: string;
  number: number;
}

interface SurahApiResponse {
  surahs: SurahOption[];
  total: number;
}

interface SessionFormProps {
  onSubmit: (data: SessionFormData) => void;
  onCancel: () => void;
  isLoading?: boolean;
}

export default function SessionForm({
  onSubmit,
  onCancel,
  isLoading = false,
}: SessionFormProps) {
  const [formData, setFormData] = useState<SessionFormData>({
    session_type: "reading_practice",
    timestamp: (() => {
      // Use local time instead of UTC for datetime-local input
      const now = new Date();
      const year = now.getFullYear();
      const month = String(now.getMonth() + 1).padStart(2, "0");
      const day = String(now.getDate()).padStart(2, "0");
      const hours = String(now.getHours()).padStart(2, "0");
      const minutes = String(now.getMinutes()).padStart(2, "0");
      return `${year}-${month}-${day}T${hours}:${minutes}`;
    })(), // Default to current local time
    duration: null,
    performance_score: null,
    notes: "",
    goal_description: "",
    surah_name: "",
    juz_number: null,
    ayah_start: null,
    ayah_end: null,
    pages_read: null,
    recency_category: "new",
    mistakes: [],
  });

  // Surah names state
  const [surahs, setSurahs] = useState<SurahOption[]>([]);
  const [surahsLoading, setSurahsLoading] = useState(true);
  const [surahsError, setSurahsError] = useState<string | null>(null);

  // Fetch Surah names on component mount
  useEffect(() => {
    const fetchSurahs = async () => {
      try {
        setSurahsLoading(true);
        const response = await fetch(
          "http://localhost:8000/api/reference/surah-names"
        );

        if (!response.ok) {
          throw new Error(`Failed to fetch Surahs: ${response.status}`);
        }

        const data: SurahApiResponse = await response.json();
        setSurahs(data.surahs);
        setSurahsError(null);
      } catch (error) {
        console.error("Error fetching Surah names:", error);
        setSurahsError(
          error instanceof Error ? error.message : "Failed to load Surahs"
        );
      } finally {
        setSurahsLoading(false);
      }
    };

    fetchSurahs();
  }, []);

  const handleInputChange = (
    e: React.ChangeEvent<
      HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement
    >
  ) => {
    const { name, value } = e.target;

    // Handle numeric fields
    if (
      [
        "duration",
        "performance_score",
        "juz_number",
        "ayah_start",
        "ayah_end",
        "pages_read",
      ].includes(name)
    ) {
      setFormData((prev) => ({
        ...prev,
        [name]: value === "" ? null : Number(value),
      }));
    } else {
      setFormData((prev) => ({
        ...prev,
        [name]: value,
      }));
    }
  };

  const addMistake = () => {
    const newMistake: MistakeData = {
      id: Date.now().toString(),
      error_category: "pronunciation",
      error_subcategory: "",
      location: "",
      details: "",
      severity_level: 2,
    };
    setFormData((prev) => ({
      ...prev,
      mistakes: [...prev.mistakes, newMistake],
    }));
  };

  const removeMistake = (id: string) => {
    setFormData((prev) => ({
      ...prev,
      mistakes: prev.mistakes.filter((mistake) => mistake.id !== id),
    }));
  };

  const updateMistake = (
    id: string,
    field: keyof Omit<MistakeData, "id">,
    value: any
  ) => {
    setFormData((prev) => ({
      ...prev,
      mistakes: prev.mistakes.map((mistake) =>
        mistake.id === id ? { ...mistake, [field]: value } : mistake
      ),
    }));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSubmit(formData);
  };

  const sessionTypes = [
    { value: "reading_practice", label: "Reading Practice (from book)" },
    { value: "memorization", label: "Memorization (from memory)" },
    { value: "audit", label: "Audit (memory without review)" },
    { value: "mistake_session", label: "Mistake Session (fixing errors)" },
    { value: "practice_test", label: "Practice Test (recall after practice)" },
    { value: "study_session", label: "Study Session (meaning/tafseer)" },
  ];

  const recencyCategories = [
    { value: "new", label: "New (within 1-2 days)" },
    { value: "near", label: "Near (1-4 weeks or <20 pages from new)" },
    { value: "far", label: "Far (>20 pages from new portion)" },
  ];

  const errorCategories = [
    { value: "pronunciation", label: "Pronunciation (Makhraj)" },
    { value: "tajweed", label: "Tajweed Rules" },
    { value: "memorization", label: "Memorization" },
    { value: "translation", label: "Translation/Meaning" },
    { value: "fluency", label: "Fluency/Flow" },
    { value: "waqf", label: "Waqf (Stopping/Starting)" },
  ];

  const errorSubcategories = {
    pronunciation: [
      { value: "makhraj", label: "Makhraj (Articulation Points)" },
      { value: "sifat", label: "Sifat (Letter Characteristics)" },
    ],
    tajweed: [
      { value: "ghunna", label: "Ghunna (Nasal Sound)" },
      { value: "qalqalah", label: "Qalqalah (Echoing)" },
      { value: "madd", label: "Madd (Elongation)" },
      { value: "idgham", label: "Idgham (Merging)" },
      { value: "ikhfa", label: "Ikhfa (Hiding)" },
      { value: "iqlab", label: "Iqlab (Conversion)" },
    ],
    memorization: [
      { value: "word_order", label: "Wrong Word Sequence" },
      { value: "verse_skip", label: "Skipped Verses" },
      { value: "word_substitution", label: "Wrong Word Used" },
      { value: "mutashabih", label: "Mutashabih (Similar Phrases)" },
      { value: "forgotten_word", label: "Forgotten Word" },
      { value: "forgotten_verse_start", label: "Forgotten Verse Start" },
      { value: "forgotten_verse_end", label: "Forgotten Verse End" },
      { value: "forgotten_verse_middle", label: "Forgotten Verse Middle" },
      { value: "verse_slipping", label: "Verse Slipping (Self-corrected)" },
    ],
    translation: [],
    fluency: [
      { value: "hesitation", label: "Hesitation/Pausing" },
      { value: "repetition", label: "Unnecessary Repetition" },
      { value: "rhythm", label: "Tempo/Rhythm Issues" },
    ],
    waqf: [
      { value: "wrong_stop", label: "Wrong Stop Location" },
      { value: "missed_stop", label: "Missed Required Stop" },
      { value: "disencouraged_stop", label: "Discouraged Stop" },
      { value: "disencouraged_continue", label: "Discouraged Continue" },
    ],
  };

  const severityLevels = [
    { value: 1, label: "1 - Minor (subtle error)" },
    { value: 2, label: "2 - Moderate (noticeable)" },
    { value: 3, label: "3 - Significant (affects quality)" },
    { value: 4, label: "4 - Major (changes meaning)" },
    { value: 5, label: "5 - Critical (completely incorrect)" },
  ];

  return (
    <div className="max-w-2xl mx-auto p-6 bg-white dark:bg-gray-800 rounded-lg shadow-md border dark:border-gray-700">
      <h2 className="text-2xl font-bold mb-6 text-gray-800 dark:text-white">
        New Quran Practice Session
      </h2>

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Session Info */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Session Date & Time *
            </label>
            <input
              type="datetime-local"
              name="timestamp"
              value={formData.timestamp}
              onChange={handleInputChange}
              required
              className="w-full p-3 border border-gray-300 rounded-md focus:ring-2 focus:ring-emerald-500 focus:border-transparent placeholder-gray-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white dark:placeholder-gray-400"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Session Type *
            </label>
            <select
              name="session_type"
              value={formData.session_type}
              onChange={handleInputChange}
              required
              className="w-full p-3 border border-gray-300 rounded-md focus:ring-2 focus:ring-emerald-500 focus:border-transparent placeholder-gray-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white dark:placeholder-gray-400"
            >
              {sessionTypes.map((type) => (
                <option key={type.value} value={type.value}>
                  {type.label}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Duration (minutes)
            </label>
            <input
              type="number"
              name="duration"
              value={formData.duration || ""}
              onChange={handleInputChange}
              min="1"
              max="480"
              className="w-full p-3 border border-gray-300 rounded-md focus:ring-2 focus:ring-emerald-500 focus:border-transparent placeholder-gray-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white dark:placeholder-gray-400"
              placeholder="e.g., 30"
            />
          </div>
        </div>

        {/* Performance Score */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Self-Rated Performance (1-10)
          </label>
          <input
            type="number"
            name="performance_score"
            value={formData.performance_score || ""}
            onChange={handleInputChange}
            min="1"
            max="10"
            className="w-full p-3 border border-gray-300 rounded-md focus:ring-2 focus:ring-emerald-500 focus:border-transparent placeholder-gray-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white dark:placeholder-gray-400"
            placeholder="Rate your performance from 1 (poor) to 10 (excellent)"
          />
        </div>

        {/* Portion Details */}
        <div className="border-t pt-6 border-gray-200 dark:border-gray-700">
          <h3 className="text-lg font-semibold mb-4 text-gray-800 dark:text-white">
            Portion Details
          </h3>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Surah Name
              </label>
              {surahsLoading ? (
                <div className="w-full p-3 border border-gray-300 rounded-md bg-gray-50 dark:bg-gray-700 dark:border-gray-600 text-gray-500 dark:text-gray-400">
                  Loading Surahs...
                </div>
              ) : surahsError ? (
                <div className="w-full p-3 border border-red-300 rounded-md bg-red-50 dark:bg-red-900/20 dark:border-red-600 text-red-600 dark:text-red-400">
                  Error: {surahsError}
                </div>
              ) : (
                <select
                  name="surah_name"
                  value={formData.surah_name}
                  onChange={handleInputChange}
                  className="w-full p-3 border border-gray-300 rounded-md focus:ring-2 focus:ring-emerald-500 focus:border-transparent placeholder-gray-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white dark:placeholder-gray-400"
                >
                  <option value="" disabled>
                    Select a Surah...
                  </option>
                  {surahs.map((surah) => (
                    <option key={surah.number} value={surah.value}>
                      {surah.label}
                    </option>
                  ))}
                </select>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Juz Number (1-30)
              </label>
              <input
                type="number"
                name="juz_number"
                value={formData.juz_number || ""}
                onChange={handleInputChange}
                min="1"
                max="30"
                className="w-full p-3 border border-gray-300 rounded-md focus:ring-2 focus:ring-emerald-500 focus:border-transparent placeholder-gray-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white dark:placeholder-gray-400"
                placeholder="e.g., 1"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Start Ayah
              </label>
              <input
                type="number"
                name="ayah_start"
                value={formData.ayah_start || ""}
                onChange={handleInputChange}
                min="1"
                className="w-full p-3 border border-gray-300 rounded-md focus:ring-2 focus:ring-emerald-500 focus:border-transparent placeholder-gray-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white dark:placeholder-gray-400"
                placeholder="e.g., 1"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                End Ayah
              </label>
              <input
                type="number"
                name="ayah_end"
                value={formData.ayah_end || ""}
                onChange={handleInputChange}
                min="1"
                className="w-full p-3 border border-gray-300 rounded-md focus:ring-2 focus:ring-emerald-500 focus:border-transparent placeholder-gray-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white dark:placeholder-gray-400"
                placeholder="e.g., 10"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Pages Read
              </label>
              <input
                type="number"
                name="pages_read"
                value={formData.pages_read || ""}
                onChange={handleInputChange}
                min="0.1"
                step="0.1"
                className="w-full p-3 border border-gray-300 rounded-md focus:ring-2 focus:ring-emerald-500 focus:border-transparent placeholder-gray-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white dark:placeholder-gray-400"
                placeholder="e.g., 2.5"
              />
            </div>
          </div>

          <div className="mt-4">
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Recency Category
            </label>
            <select
              name="recency_category"
              value={formData.recency_category}
              onChange={handleInputChange}
              className="w-full p-3 border border-gray-300 rounded-md focus:ring-2 focus:ring-emerald-500 focus:border-transparent placeholder-gray-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white dark:placeholder-gray-400"
            >
              {recencyCategories.map((category) => (
                <option key={category.value} value={category.value}>
                  {category.label}
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Goal and Notes */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Session Goal
          </label>
          <input
            type="text"
            name="goal_description"
            value={formData.goal_description}
            onChange={handleInputChange}
            maxLength={200}
            className="w-full p-3 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            placeholder="What do you aim to achieve in this session?"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Additional Notes
          </label>
          <textarea
            name="notes"
            value={formData.notes}
            onChange={handleInputChange}
            maxLength={1000}
            rows={4}
            className="w-full p-3 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            placeholder="Any additional notes about this session..."
          />
        </div>

        {/* Mistakes Section */}
        <div className="border-t pt-6 border-gray-200 dark:border-gray-700">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold text-gray-800 dark:text-white">
              Mistakes Recording
            </h3>
            <button
              type="button"
              onClick={addMistake}
              className="bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-300 px-4 py-2 rounded-md hover:bg-red-200 dark:hover:bg-red-900/50 transition-colors text-sm font-medium"
            >
              ➕ Add Mistake
            </button>
          </div>

          {formData.mistakes.length === 0 ? (
            <div className="text-gray-500 dark:text-gray-400 text-center py-8 bg-gray-50 dark:bg-gray-700 rounded-lg">
              No mistakes recorded. Click "Add Mistake" to record any errors
              made during the session.
            </div>
          ) : (
            <div className="space-y-4">
              {formData.mistakes.map((mistake, index) => (
                <div
                  key={mistake.id}
                  className="bg-gray-50 dark:bg-gray-700 p-4 rounded-lg border dark:border-gray-600"
                >
                  <div className="flex items-center justify-between mb-3">
                    <h4 className="font-medium text-gray-900 dark:text-white">
                      Mistake {index + 1}
                    </h4>
                    <button
                      type="button"
                      onClick={() => removeMistake(mistake.id)}
                      className="text-red-600 dark:text-red-400 hover:text-red-800 dark:hover:text-red-300 text-sm"
                    >
                      🗑️ Remove
                    </button>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {/* Error Category */}
                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                        Error Category *
                      </label>
                      <select
                        value={mistake.error_category}
                        onChange={(e) =>
                          updateMistake(
                            mistake.id,
                            "error_category",
                            e.target.value
                          )
                        }
                        className="w-full p-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-emerald-500 focus:border-transparent text-sm placeholder-gray-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white dark:placeholder-gray-400"
                        required
                      >
                        {errorCategories.map((category) => (
                          <option key={category.value} value={category.value}>
                            {category.label}
                          </option>
                        ))}
                      </select>
                    </div>

                    {/* Error Subcategory */}
                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                        Error Subcategory
                      </label>
                      <select
                        value={mistake.error_subcategory}
                        onChange={(e) =>
                          updateMistake(
                            mistake.id,
                            "error_subcategory",
                            e.target.value
                          )
                        }
                        className="w-full p-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-emerald-500 focus:border-transparent text-sm placeholder-gray-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white dark:placeholder-gray-400"
                      >
                        <option value="">Select subcategory...</option>
                        {errorSubcategories[
                          mistake.error_category as keyof typeof errorSubcategories
                        ]?.map((subcategory) => (
                          <option
                            key={subcategory.value}
                            value={subcategory.value}
                          >
                            {subcategory.label}
                          </option>
                        ))}
                      </select>
                    </div>

                    {/* Severity Level */}
                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                        Severity Level
                      </label>
                      <select
                        value={mistake.severity_level}
                        onChange={(e) =>
                          updateMistake(
                            mistake.id,
                            "severity_level",
                            Number(e.target.value)
                          )
                        }
                        className="w-full p-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-emerald-500 focus:border-transparent text-sm placeholder-gray-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white dark:placeholder-gray-400"
                      >
                        {severityLevels.map((level) => (
                          <option key={level.value} value={level.value}>
                            {level.label}
                          </option>
                        ))}
                      </select>
                    </div>

                    {/* Location */}
                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                        Location *
                      </label>
                      <input
                        type="text"
                        value={mistake.location}
                        onChange={(e) =>
                          updateMistake(mistake.id, "location", e.target.value)
                        }
                        placeholder="e.g., Surah Al-Baqarah, Ayah 5, Word 3"
                        className="w-full p-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-emerald-500 focus:border-transparent text-sm placeholder-gray-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white dark:placeholder-gray-400"
                        required
                      />
                    </div>
                  </div>

                  {/* Details */}
                  <div className="mt-3">
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Details
                    </label>
                    <textarea
                      value={mistake.details}
                      onChange={(e) =>
                        updateMistake(mistake.id, "details", e.target.value)
                      }
                      placeholder="Describe the mistake and any additional context..."
                      rows={2}
                      maxLength={1000}
                      className="w-full p-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm"
                    />
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Submit Buttons */}
        <div className="flex gap-4 pt-6">
          <button
            type="submit"
            disabled={isLoading}
            className="flex-1 bg-blue-600 text-white py-3 px-6 rounded-md hover:bg-blue-700 focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            {isLoading ? "Creating..." : "Create Session"}
          </button>

          <button
            type="button"
            onClick={onCancel}
            disabled={isLoading}
            className="flex-1 bg-gray-300 text-gray-700 py-3 px-6 rounded-md hover:bg-gray-400 focus:ring-2 focus:ring-gray-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            Cancel
          </button>
        </div>
      </form>
    </div>
  );
}
