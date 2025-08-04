import SessionCard from "../../components/SessionCard";
import SessionsTable from "../../components/SessionsTable";
// import ApiTest from "../../components/ApiTest"; // Temporarily disabled for deployment

export default function TestComponentsPage() {
  // Sample session data for testing
  const sampleSessions = [
    {
      sessionType: "reading_practice",
      surahName: "Al-Fatiha",
      duration: 15,
      performanceScore: 9,
      timestamp: "2025-01-25T10:30:00",
      mistakeCount: 1,
    },
    {
      sessionType: "memorization",
      surahName: "Al-Ikhlas",
      duration: 25,
      performanceScore: 7,
      timestamp: "2025-01-24T18:45:00",
      mistakeCount: 3,
    },
    {
      sessionType: "audit",
      surahName: "An-Nas",
      duration: 10,
      performanceScore: 5,
      timestamp: "2025-01-23T14:20:00",
      mistakeCount: 5,
    },
  ];

  // Extended data for table (more sessions)
  const tableSessions = [
    {
      id: "1",
      date: "2025-01-25T10:30:00",
      surahName: "Al-Fatiha",
      sessionType: "reading_practice",
      duration: 15,
      performanceScore: 9,
      mistakeCount: 1,
    },
    {
      id: "2",
      date: "2025-01-24T18:45:00",
      surahName: "Al-Ikhlas",
      sessionType: "memorization",
      duration: 25,
      performanceScore: 7,
      mistakeCount: 3,
    },
    {
      id: "3",
      date: "2025-01-23T14:20:00",
      surahName: "An-Nas",
      sessionType: "audit",
      duration: 10,
      performanceScore: 5,
      mistakeCount: 5,
    },
    {
      id: "4",
      date: "2025-01-22T16:15:00",
      surahName: "Al-Baqarah",
      sessionType: "memorization",
      duration: 45,
      performanceScore: 8,
      mistakeCount: 2,
    },
    {
      id: "5",
      date: "2025-01-21T09:00:00",
      surahName: "Al-Mulk",
      sessionType: "reading_practice",
      duration: 20,
      performanceScore: 6,
      mistakeCount: 7,
    },
    {
      id: "6",
      date: "2025-01-20T20:30:00",
      surahName: "Yaseen",
      sessionType: "practice_test",
      duration: 35,
      performanceScore: 10,
      mistakeCount: 0,
    },
    {
      id: "7",
      date: "2025-01-19T15:45:00",
      surahName: "Al-Kahf",
      sessionType: "mistake_session",
      duration: 12,
      performanceScore: 6,
      mistakeCount: 2,
    },
    {
      id: "8",
      date: "2025-01-18T11:00:00",
      surahName: "Ar-Rahman",
      sessionType: "study_session",
      duration: 40,
      performanceScore: 8,
      mistakeCount: 0,
    },
  ];

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 py-8">
      <div className="max-w-6xl mx-auto px-6">
        {/* Header */}
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">
            🧪 Component Testing Lab
          </h1>
          <p className="text-gray-600 dark:text-gray-400">
            Testing API connection and components
          </p>
        </div>

        {/* API Connection Test */}
        <div className="mb-12">
          {/* <ApiTest /> */}
          <div className="p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
            <p className="text-yellow-800">
              ApiTest component temporarily disabled for deployment
            </p>
          </div>
        </div>

        {/* Component Demo */}
        <div className="space-y-12">
          {/* SessionCard - For Dashboard/Previews */}
          <div className="space-y-6">
            <div>
              <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">
                SessionCard Component
              </h2>
              <p className="text-gray-600 dark:text-gray-400 text-sm">
                📍 <strong>Use for:</strong> Dashboard previews, recent
                sessions, highlights
              </p>
            </div>

            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
              {sampleSessions.map((session, index) => (
                <SessionCard
                  key={index}
                  sessionType={session.sessionType}
                  surahName={session.surahName}
                  duration={session.duration || 15}
                  performanceScore={session.performanceScore}
                  timestamp={session.timestamp}
                  mistakeCount={session.mistakeCount}
                />
              ))}
            </div>
          </div>

          {/* SessionsTable - For Data Management */}
          <div className="space-y-6">
            <div>
              <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">
                SessionsTable Component
              </h2>
              <p className="text-gray-600 dark:text-gray-400 text-sm">
                📍 <strong>Use for:</strong> Viewing all sessions, searching,
                sorting, data management
              </p>
            </div>

            <SessionsTable sessions={tableSessions} />
          </div>

          {/* Component Comparison */}
          <div className="bg-blue-50 dark:bg-blue-900/20 rounded-xl p-6 border border-blue-200 dark:border-blue-800">
            <h3 className="font-semibold text-blue-800 dark:text-blue-200 mb-4">
              🎯 Perfect! Now You Have Both Views
            </h3>
            <div className="grid md:grid-cols-2 gap-6 text-sm">
              <div>
                <h4 className="font-medium text-blue-800 dark:text-blue-200 mb-2">
                  SessionCard (Cards)
                </h4>
                <ul className="text-blue-700 dark:text-blue-300 space-y-1">
                  <li>• Visual and appealing</li>
                  <li>• Great for small numbers (3-6 items)</li>
                  <li>• Dashboard highlights</li>
                  <li>• Mobile-friendly</li>
                </ul>
              </div>
              <div>
                <h4 className="font-medium text-blue-800 dark:text-blue-200 mb-2">
                  SessionsTable (Table)
                </h4>
                <ul className="text-blue-700 dark:text-blue-300 space-y-1">
                  <li>• Data-dense and scannable</li>
                  <li>• Perfect for large datasets</li>
                  <li>• Sortable and searchable</li>
                  <li>• Action buttons (Edit, Delete)</li>
                </ul>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
