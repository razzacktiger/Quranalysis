interface Mistake {
  id: string;
  errorCategory: string;
  errorSubcategory?: string;
  severityLevel: number; // 1-5
  location: string; // e.g., "Al-Fatiha verse 3"
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

interface DetailedSession {
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

interface SessionDetailProps {
  session: DetailedSession | null;
  onClose: () => void;
  onEdit?: (session: DetailedSession) => void;
}

export default function SessionDetail({
  session,
  onClose,
  onEdit,
}: SessionDetailProps) {
  if (!session) return null;

  const formatDateTime = (dateString: string) => {
    const date = new Date(dateString);
    return {
      date: date.toLocaleDateString("en-US", {
        weekday: "long",
        year: "numeric",
        month: "long",
        day: "numeric",
      }),
      time: date.toLocaleTimeString("en-US", {
        hour: "2-digit",
        minute: "2-digit",
      }),
    };
  };

  const getPerformanceColor = (score: number) => {
    if (score >= 8) return "text-green-600 bg-green-50";
    if (score >= 6) return "text-yellow-600 bg-yellow-50";
    return "text-red-600 bg-red-50";
  };

  const getSeverityColor = (level: number) => {
    if (level <= 2) return "bg-yellow-100 text-yellow-800";
    if (level <= 3) return "bg-orange-100 text-orange-800";
    return "bg-red-100 text-red-800";
  };

  const { date, time } = formatDateTime(session.date);

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-white dark:bg-gray-800 rounded-xl shadow-xl max-w-4xl w-full max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="sticky top-0 bg-white dark:bg-gray-800 border-b dark:border-gray-700 px-6 py-4 flex items-center justify-between">
          <div>
            <h2 className="text-2xl font-bold text-gray-900 dark:text-white">
              Session Details
            </h2>
            <p className="text-gray-600 dark:text-gray-400">
              {session.portionDetails.surahName} • {date}
            </p>
          </div>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-700 hover:bg-gray-100 dark:text-gray-400 dark:hover:text-gray-100 dark:hover:bg-gray-700 text-2xl w-8 h-8 flex items-center justify-center rounded-full transition-all duration-200"
          >
            ✕
          </button>
        </div>

        {/* Content */}
        <div className="p-6 space-y-8">
          {/* Basic Session Info */}
          <div className="grid md:grid-cols-2 gap-6">
            <div className="space-y-4">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                📅 Session Information
              </h3>
              <div className="space-y-3">
                <div className="flex justify-between">
                  <span className="text-gray-600 dark:text-gray-400">
                    Date:
                  </span>
                  <span className="font-medium text-gray-900 dark:text-white">
                    {date}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600 dark:text-gray-400">
                    Time:
                  </span>
                  <span className="font-medium text-gray-900 dark:text-white">
                    {time}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600 dark:text-gray-400">
                    Type:
                  </span>
                  <span className="font-medium text-gray-900 dark:text-white capitalize">
                    {session.sessionType.replace("_", " ")}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600 dark:text-gray-400">
                    Duration:
                  </span>
                  <span className="font-medium text-gray-900 dark:text-white">
                    {session.duration} minutes
                  </span>
                </div>
              </div>
            </div>

            <div className="space-y-4">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                📊 Performance
              </h3>
              <div className="space-y-3">
                <div className="flex justify-between items-center">
                  <span className="text-gray-600 dark:text-gray-400">
                    Self-rated Score:
                  </span>
                  <span
                    className={`px-3 py-1 rounded-full font-medium ${getPerformanceColor(
                      session.performanceScore
                    )}`}
                  >
                    {session.performanceScore}/10
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600 dark:text-gray-400">
                    Total Mistakes:
                  </span>
                  <span className="font-medium text-gray-900 dark:text-white">
                    {session.mistakes.length}
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* Portion Details */}
          <div>
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
              📖 Portion Details
            </h3>
            <div className="bg-gray-50 dark:bg-gray-800 rounded-lg p-4 space-y-3 border dark:border-gray-700">
              <div className="grid md:grid-cols-2 gap-4">
                <div>
                  <span className="text-gray-600 dark:text-gray-400 block">
                    Surah:
                  </span>
                  <span className="font-medium text-gray-900 dark:text-white text-lg">
                    {session.portionDetails.surahName}
                  </span>
                </div>
                {session.portionDetails.ayahStart &&
                  session.portionDetails.ayahEnd && (
                    <div>
                      <span className="text-gray-600 dark:text-gray-400 block">
                        Ayah Range:
                      </span>
                      <span className="font-medium text-gray-900 dark:text-white">
                        {session.portionDetails.ayahStart} -{" "}
                        {session.portionDetails.ayahEnd}
                      </span>
                    </div>
                  )}
                {session.portionDetails.juzNumber && (
                  <div>
                    <span className="text-gray-600 dark:text-gray-400 block">
                      Juz:
                    </span>
                    <span className="font-medium text-gray-900 dark:text-white">
                      {session.portionDetails.juzNumber}
                    </span>
                  </div>
                )}
                {session.portionDetails.pagesRead && (
                  <div>
                    <span className="text-gray-600 dark:text-gray-400 block">
                      Pages Read:
                    </span>
                    <span className="font-medium text-gray-900 dark:text-white">
                      {session.portionDetails.pagesRead}
                    </span>
                  </div>
                )}
              </div>
              <div>
                <span className="text-gray-600 dark:text-gray-400 block">
                  Recency Category:
                </span>
                <span className="inline-block mt-1 px-3 py-1 bg-emerald-100 text-emerald-800 rounded-full text-sm font-medium capitalize">
                  {session.portionDetails.recencyCategory}
                </span>
              </div>
            </div>
          </div>

          {/* Session Goal & Notes */}
          {(session.sessionGoal || session.additionalNotes) && (
            <div className="grid md:grid-cols-2 gap-6">
              {session.sessionGoal && (
                <div>
                  <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-3">
                    🎯 Session Goal
                  </h3>
                  <div className="bg-blue-50 dark:bg-blue-900/30 border border-blue-200 dark:border-blue-800 p-4 rounded-lg">
                    <p className="text-blue-900 dark:text-blue-100 leading-relaxed">
                      {session.sessionGoal}
                    </p>
                  </div>
                </div>
              )}
              {session.additionalNotes && (
                <div>
                  <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-3">
                    📝 Additional Notes
                  </h3>
                  <div className="bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 p-4 rounded-lg">
                    <p className="text-gray-800 dark:text-gray-200 leading-relaxed">
                      {session.additionalNotes}
                    </p>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Mistakes Section */}
          {session.mistakes.length > 0 && (
            <div>
              <div className="flex items-center mb-6">
                <div className="flex-shrink-0 w-12 h-12 bg-gradient-to-br from-orange-400 to-red-500 rounded-full flex items-center justify-center mr-4 shadow-lg">
                  <span className="text-white text-xl">⚠️</span>
                </div>
                <div>
                  <h3 className="text-xl font-bold text-gray-900 dark:text-white">
                    Mistakes Found
                  </h3>
                  <p className="text-sm text-gray-600 dark:text-gray-400">
                    {session.mistakes.length}{" "}
                    {session.mistakes.length === 1 ? "area" : "areas"} for
                    improvement
                  </p>
                </div>
              </div>
              <div className="space-y-3">
                {session.mistakes.map((mistake) => (
                  <div
                    key={mistake.id}
                    className="relative overflow-hidden bg-gradient-to-r from-orange-50 to-red-50 dark:from-orange-900/20 dark:to-red-900/20 border border-orange-200 dark:border-orange-800 rounded-xl p-5 shadow-sm hover:shadow-md transition-all duration-200"
                  >
                    {/* Severity Level Badge - Top Right */}
                    <div className="absolute top-3 right-3">
                      <span
                        className={`inline-flex items-center px-3 py-1.5 rounded-full text-xs font-semibold shadow-sm ${getSeverityColor(
                          mistake.severityLevel
                        )}`}
                      >
                        <div className="w-2 h-2 rounded-full bg-current mr-1.5 animate-pulse"></div>
                        Level {mistake.severityLevel}
                      </span>
                    </div>

                    {/* Main Content */}
                    <div className="pr-20">
                      {/* Error Category & Subcategory */}
                      <div className="flex items-center mb-3">
                        <div className="flex-shrink-0 w-10 h-10 bg-orange-100 dark:bg-orange-900/50 rounded-full flex items-center justify-center mr-3">
                          <span className="text-lg">
                            {mistake.errorCategory === "pronunciation"
                              ? "🗣️"
                              : mistake.errorCategory === "memorization"
                              ? "🧠"
                              : mistake.errorCategory === "tajweed"
                              ? "📖"
                              : mistake.errorCategory === "translation"
                              ? "🌐"
                              : "⚠️"}
                          </span>
                        </div>
                        <div>
                          <h4 className="text-lg font-semibold text-gray-900 dark:text-white capitalize">
                            {mistake.errorCategory}
                          </h4>
                          {mistake.errorSubcategory && (
                            <p className="text-sm text-orange-600 dark:text-orange-400 font-medium capitalize">
                              {mistake.errorSubcategory}
                            </p>
                          )}
                        </div>
                      </div>

                      {/* Location */}
                      <div className="flex items-center mb-3 bg-white/50 dark:bg-gray-800/50 rounded-lg px-3 py-2">
                        <span className="text-orange-600 dark:text-orange-400 mr-2">
                          📍
                        </span>
                        <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
                          {mistake.location}
                        </span>
                      </div>

                      {/* Additional Notes */}
                      {mistake.additionalNotes && (
                        <div className="bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-blue-900/20 dark:to-indigo-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-3 mt-3">
                          <div className="flex items-start">
                            <span className="text-blue-600 dark:text-blue-400 mr-2 flex-shrink-0 mt-0.5">
                              💭
                            </span>
                            <p className="text-sm text-blue-800 dark:text-blue-200 italic leading-relaxed">
                              {mistake.additionalNotes}
                            </p>
                          </div>
                        </div>
                      )}
                    </div>

                    {/* Decorative gradient line */}
                    <div className="absolute bottom-0 left-0 right-0 h-1 bg-gradient-to-r from-orange-400 via-red-400 to-pink-400"></div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* No Mistakes */}
          {session.mistakes.length === 0 && (
            <div className="text-center py-8">
              <div className="text-green-500 text-4xl mb-2">✅</div>
              <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-1">
                Perfect Session!
              </h3>
              <p className="text-gray-600 dark:text-gray-400">
                No mistakes were recorded for this practice session.
              </p>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="sticky bottom-0 bg-white dark:bg-gray-800 border-t dark:border-gray-700 px-6 py-4 flex justify-end space-x-3">
          <button
            onClick={onClose}
            className="px-4 py-2 border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-50 hover:text-gray-900 dark:hover:bg-gray-700 dark:hover:text-white dark:hover:border-gray-500 transition-all duration-200"
          >
            Close
          </button>
          {onEdit && (
            <button
              onClick={() => onEdit(session)}
              className="px-4 py-2 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 transition-colors"
            >
              Edit Session
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
