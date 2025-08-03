"use client";

import { useState } from "react";
import SessionDetail from "./SessionDetail";
import EditSessionModal from "./EditSessionModal";

interface Session {
  id: string;
  date: string;
  surahName: string;
  sessionType: string;
  duration: number;
  performanceScore: number;
  mistakeCount: number;
}

interface SessionsTableProps {
  sessions: Session[];
}

type SortField =
  | "date"
  | "surahName"
  | "sessionType"
  | "duration"
  | "performanceScore"
  | "mistakeCount";
type SortDirection = "asc" | "desc";

export default function SessionsTable({ sessions }: SessionsTableProps) {
  const [searchTerm, setSearchTerm] = useState("");
  const [sortField, setSortField] = useState<SortField>("date");
  const [sortDirection, setSortDirection] = useState<SortDirection>("desc");
  const [selectedSession, setSelectedSession] = useState<Session | null>(null);
  const [editingSession, setEditingSession] = useState<Session | null>(null);

  // Helper functions (moved to top to avoid hoisting issues)
  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
    });
  };

  // Format session type for display
  const formatSessionType = (sessionType: string) => {
    const sessionTypeMap: Record<string, string> = {
      reading_practice: "Reading Practice",
      memorization: "Memorization",
      audit: "Audit",
      mistake_session: "Mistake Session",
      practice_test: "Practice Test",
      study_session: "Study Session",
    };
    return sessionTypeMap[sessionType] || sessionType;
  };

  // Filter sessions based on search term (comprehensive search)
  const filteredSessions = sessions.filter((session) => {
    const searchLower = searchTerm.toLowerCase();

    // Search in multiple fields
    return (
      // Surah name
      session.surahName.toLowerCase().includes(searchLower) ||
      // Session type
      session.sessionType.toLowerCase().includes(searchLower) ||
      // Performance score (both number and "X/10" format)
      session.performanceScore.toString().includes(searchLower) ||
      `${session.performanceScore}/10`.includes(searchLower) ||
      // Duration (both number and "Xm" format)
      session.duration.toString().includes(searchLower) ||
      `${session.duration}m`.includes(searchLower) ||
      // Mistake count
      session.mistakeCount.toString().includes(searchLower) ||
      // Date (formatted)
      formatDate(session.date).toLowerCase().includes(searchLower)
    );
  });

  // Sort sessions
  const sortedSessions = [...filteredSessions].sort((a, b) => {
    let aVal = a[sortField];
    let bVal = b[sortField];

    // Handle date sorting
    if (sortField === "date") {
      aVal = new Date(a.date).getTime();
      bVal = new Date(b.date).getTime();
    }

    if (aVal < bVal) return sortDirection === "asc" ? -1 : 1;
    if (aVal > bVal) return sortDirection === "asc" ? 1 : -1;
    return 0;
  });

  // Handle column header click for sorting
  const handleSort = (field: SortField) => {
    if (sortField === field) {
      setSortDirection(sortDirection === "asc" ? "desc" : "asc");
    } else {
      setSortField(field);
      setSortDirection("desc");
    }
  };

  // Handle row click to show details
  const handleRowClick = (session: Session) => {
    setSelectedSession(session);
  };

  // Handle edit button click
  const handleEditClick = (e: React.MouseEvent, session: Session) => {
    e.stopPropagation(); // Prevent row click
    setEditingSession(session);
  };

  // Handle save from edit modal
  const handleSaveEdit = (updatedSession: any) => {
    // TODO: Replace with actual API call
    console.log("Saving updated session:", updatedSession);
    // For now, just close the modal
    setEditingSession(null);
  };

  // Get sort icon for column headers
  const getSortIcon = (field: SortField) => {
    if (sortField !== field) return "↕️";
    return sortDirection === "asc" ? "↑" : "↓";
  };

  // Get performance color
  const getPerformanceColor = (score: number) => {
    if (score >= 8) return "text-green-600 font-medium";
    if (score >= 6) return "text-yellow-600 font-medium";
    return "text-red-600 font-medium";
  };

  return (
    <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border dark:border-gray-700">
      {/* Header with Search */}
      <div className="p-6 border-b dark:border-gray-700">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-xl font-semibold text-gray-900 dark:text-white">
            Practice Sessions
          </h2>
          <span className="text-sm text-gray-500 dark:text-gray-400">
            {sortedSessions.length} sessions
          </span>
        </div>

        {/* Search Bar */}
        <div className="relative">
          <input
            type="text"
            placeholder="Search by Surah, type, score, duration, mistakes, or date..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400 focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
          />
          <div className="absolute right-3 top-2.5 text-gray-400">🔍</div>
        </div>
      </div>

      {/* Table */}
      <div className="overflow-x-auto">
        <table className="w-full">
          {/* Table Header */}
          <thead className="bg-gray-50 dark:bg-gray-750 border-b dark:border-gray-700">
            <tr>
              <th
                className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider cursor-pointer hover:bg-gray-100 dark:hover:bg-gray-700"
                onClick={() => handleSort("date")}
              >
                Date {getSortIcon("date")}
              </th>
              <th
                className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider cursor-pointer hover:bg-gray-100 dark:hover:bg-gray-700"
                onClick={() => handleSort("surahName")}
              >
                Surah {getSortIcon("surahName")}
              </th>
              <th
                className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider cursor-pointer hover:bg-gray-100 dark:hover:bg-gray-700"
                onClick={() => handleSort("sessionType")}
              >
                Type {getSortIcon("sessionType")}
              </th>
              <th
                className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider cursor-pointer hover:bg-gray-100 dark:hover:bg-gray-700"
                onClick={() => handleSort("duration")}
              >
                Duration {getSortIcon("duration")}
              </th>
              <th
                className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider cursor-pointer hover:bg-gray-100 dark:hover:bg-gray-700"
                onClick={() => handleSort("performanceScore")}
              >
                Score {getSortIcon("performanceScore")}
              </th>
              <th
                className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider cursor-pointer hover:bg-gray-100 dark:hover:bg-gray-700"
                onClick={() => handleSort("mistakeCount")}
              >
                Mistakes {getSortIcon("mistakeCount")}
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                Actions
              </th>
            </tr>
          </thead>

          {/* Table Body */}
          <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
            {sortedSessions.map((session) => (
              <tr
                key={session.id}
                className="hover:bg-emerald-50 dark:hover:bg-emerald-900/20 cursor-pointer transition-colors"
                onClick={() => handleRowClick(session)}
              >
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-white">
                  {formatDate(session.date)}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900 dark:text-white">
                  {session.surahName}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600 dark:text-gray-400">
                  {formatSessionType(session.sessionType)}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-white">
                  {session.duration}m
                </td>
                <td
                  className={`px-6 py-4 whitespace-nowrap text-sm ${getPerformanceColor(
                    session.performanceScore
                  )}`}
                >
                  {session.performanceScore}/10
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-white">
                  {session.mistakeCount > 0 ? (
                    <span className="inline-flex items-center">
                      ⚠️ {session.mistakeCount}
                    </span>
                  ) : (
                    <span className="text-green-600">✅ None</span>
                  )}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm">
                  <div className="flex space-x-2">
                    <button
                      onClick={() => handleRowClick(session)}
                      className="text-emerald-600 hover:text-emerald-800 dark:text-emerald-400 dark:hover:text-emerald-300 font-medium"
                    >
                      View
                    </button>
                    <button
                      onClick={(e) => handleEditClick(e, session)}
                      className="text-blue-600 hover:text-blue-800 dark:text-blue-400 dark:hover:text-blue-300 font-medium"
                    >
                      Edit
                    </button>
                    <button className="text-red-600 hover:text-red-800 dark:text-red-400 dark:hover:text-red-300 font-medium">
                      Delete
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>

        {/* Empty State */}
        {sortedSessions.length === 0 && (
          <div className="text-center py-12">
            <div className="text-gray-400 text-4xl mb-4">📚</div>
            <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">
              No sessions found
            </h3>
            <p className="text-gray-500 dark:text-gray-400">
              {searchTerm
                ? "Try adjusting your search terms"
                : "Start by creating your first practice session"}
            </p>
          </div>
        )}
      </div>

      {/* Session Detail Modal */}
      <SessionDetail
        session={
          selectedSession ? convertToDetailedSession(selectedSession) : null
        }
        onClose={() => setSelectedSession(null)}
        onEdit={(session) => {
          setSelectedSession(null); // Close detail modal
          setEditingSession(selectedSession); // Open edit modal
        }}
      />

      {/* Edit Session Modal */}
      <EditSessionModal
        session={
          editingSession ? convertToDetailedSession(editingSession) : null
        }
        onClose={() => setEditingSession(null)}
        onSave={handleSaveEdit}
      />
    </div>
  );
}

// Helper function to convert basic session to detailed session for demo
function convertToDetailedSession(session: Session) {
  return {
    id: session.id,
    date: session.date,
    sessionType: session.sessionType,
    duration: session.duration,
    performanceScore: session.performanceScore,
    portionDetails: {
      surahName: session.surahName,
      ayahStart: session.surahName === "Al-Fatiha" ? 1 : 15,
      ayahEnd: session.surahName === "Al-Fatiha" ? 7 : 25,
      juzNumber: session.surahName === "Al-Baqarah" ? 1 : undefined,
      pagesRead: session.duration > 30 ? 3 : 1,
      recencyCategory: "recent" as const,
    },
    sessionGoal: `Focus on improving ${session.sessionType.replace(
      "_",
      " "
    )} with ${session.surahName}`,
    additionalNotes:
      session.mistakeCount > 3
        ? "Need more practice with this portion"
        : "Good progress overall",
    mistakes: generateSampleMistakes(session.mistakeCount, session.surahName),
  };
}

// Generate sample mistakes for demo
function generateSampleMistakes(count: number, surahName: string) {
  const errorCategories = [
    "Tajweed",
    "Memorization",
    "Pronunciation",
    "Translation",
  ];
  const errorSubcategories = [
    "Misreading word",
    "Forgetting verse",
    "Incorrect makhraj",
    "Wrong meaning",
  ];
  const mistakes = [];

  for (let i = 0; i < count; i++) {
    mistakes.push({
      id: `mistake-${i}`,
      errorCategory: errorCategories[i % errorCategories.length],
      errorSubcategory: errorSubcategories[i % errorSubcategories.length],
      severityLevel: Math.min(5, Math.max(1, Math.floor(count / 2) + 1)),
      location: `${surahName} verse ${i + 1}`,
      additionalNotes:
        i % 2 === 0
          ? `Need to practice this ${errorCategories[
              i % errorCategories.length
            ].toLowerCase()} rule more`
          : undefined,
    });
  }

  return mistakes;
}
