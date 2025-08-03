interface SessionCardProps {
  sessionType: string;
  surahName: string;
  duration: number;
  performanceScore: number;
  timestamp: string;
  mistakeCount?: number;
}

export default function SessionCard({
  sessionType,
  surahName,
  duration,
  performanceScore,
  timestamp,
  mistakeCount = 0,
}: SessionCardProps) {
  // Format the timestamp for display
  const formatDate = (isoString: string) => {
    const date = new Date(isoString);
    return date.toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  // Get performance color based on score
  const getPerformanceColor = (score: number) => {
    if (score >= 8) return "text-green-600 bg-green-50";
    if (score >= 6) return "text-yellow-600 bg-yellow-50";
    return "text-red-600 bg-red-50";
  };

  return (
    <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border dark:border-gray-700 p-6 hover:shadow-md transition-shadow">
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <span className="text-sm font-medium text-emerald-600 dark:text-emerald-400 capitalize">
          {sessionType.replace("_", " ")}
        </span>
        <span className="text-xs text-gray-500 dark:text-gray-400">
          {formatDate(timestamp)}
        </span>
      </div>

      {/* Surah Name */}
      <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-3">
        {surahName || "General Practice"}
      </h3>

      {/* Stats Row */}
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-4">
          {/* Duration */}
          <div className="text-sm">
            <span className="text-gray-500 dark:text-gray-400">⏱️ </span>
            <span className="font-medium text-gray-900 dark:text-white">
              {duration}m
            </span>
          </div>

          {/* Mistake Count */}
          {mistakeCount > 0 && (
            <div className="text-sm">
              <span className="text-gray-500 dark:text-gray-400">⚠️ </span>
              <span className="font-medium text-gray-900 dark:text-white">
                {mistakeCount}
              </span>
            </div>
          )}
        </div>

        {/* Performance Score */}
        <div
          className={`px-3 py-1 rounded-full text-sm font-medium ${getPerformanceColor(
            performanceScore
          )}`}
        >
          {performanceScore}/10
        </div>
      </div>
    </div>
  );
}
