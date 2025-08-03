"use client";

import { useState, useEffect } from "react";
import { SessionsApi, SessionData } from "@/lib/api-client";
import { supabase } from "@/lib/supabase";
import SessionDetail from "./SessionDetail";
import EditSessionModal from "./EditSessionModal";

type SortField =
  | "session_date"
  | "surah_name"
  | "session_type"
  | "duration_minutes"
  | "performance_score"
  | "mistakeCount";
type SortDirection = "asc" | "desc";

export default function SessionsTableReal() {
  const [sessions, setSessions] = useState<SessionData[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [sortField, setSortField] = useState<SortField>("session_date");
  const [sortDirection, setSortDirection] = useState<SortDirection>("desc");
  const [selectedSession, setSelectedSession] = useState<SessionData | null>(
    null
  );
  const [editingSession, setEditingSession] = useState<SessionData | null>(
    null
  );
  const [deletingSession, setDeletingSession] = useState<SessionData | null>(
    null
  );
  const [isDeleting, setIsDeleting] = useState(false);
  const [user, setUser] = useState<any>(null);

  // Check authentication and fetch sessions
  useEffect(() => {
    const checkAuthAndFetchSessions = async () => {
      try {
        setLoading(true);
        setError(null);

        // Check authentication
        const {
          data: { session },
        } = await supabase.auth.getSession();
        if (!session?.user) {
          setError("Please sign in to view your sessions");
          setLoading(false);
          return;
        }

        setUser(session.user);

        // Fetch sessions
        const result = await SessionsApi.getSessions();
        if (result.error) {
          setError(result.error);
        } else {
          setSessions(result.data || []);
        }
      } catch (err) {
        setError("Failed to load sessions");
        console.error("Session fetch error:", err);
      } finally {
        setLoading(false);
      }
    };

    checkAuthAndFetchSessions();

    // Listen for auth changes
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((event, session) => {
      if (event === "SIGNED_IN" && session?.user) {
        setUser(session.user);
        checkAuthAndFetchSessions();
      } else if (event === "SIGNED_OUT") {
        setUser(null);
        setSessions([]);
        setError("Please sign in to view your sessions");
      }
    });

    return () => subscription.unsubscribe();
  }, []);

  // Helper functions
  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
    });
  };

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

  // Filter and sort sessions
  const filteredSessions = sessions.filter((session) => {
    const searchLower = searchTerm.toLowerCase();
    const mistakeCount = session.mistakes?.length || 0;

    return (
      session.surah_name.toLowerCase().includes(searchLower) ||
      session.session_type.toLowerCase().includes(searchLower) ||
      formatSessionType(session.session_type)
        .toLowerCase()
        .includes(searchLower) ||
      session.performance_score.toString().includes(searchLower) ||
      `${session.performance_score}/10`.includes(searchLower) ||
      session.duration_minutes.toString().includes(searchLower) ||
      `${session.duration_minutes}m`.includes(searchLower) ||
      mistakeCount.toString().includes(searchLower) ||
      formatDate(session.session_date).toLowerCase().includes(searchLower)
    );
  });

  const sortedSessions = [...filteredSessions].sort((a, b) => {
    let aValue: any, bValue: any;

    switch (sortField) {
      case "session_date":
        aValue = new Date(a.session_date);
        bValue = new Date(b.session_date);
        break;
      case "mistakeCount":
        aValue = a.mistakes?.length || 0;
        bValue = b.mistakes?.length || 0;
        break;
      default:
        aValue = a[sortField as keyof SessionData];
        bValue = b[sortField as keyof SessionData];
    }

    if (aValue < bValue) return sortDirection === "asc" ? -1 : 1;
    if (aValue > bValue) return sortDirection === "asc" ? 1 : -1;
    return 0;
  });

  const handleSort = (field: SortField) => {
    if (field === sortField) {
      setSortDirection(sortDirection === "asc" ? "desc" : "asc");
    } else {
      setSortField(field);
      setSortDirection("asc");
    }
  };

  const handleRefresh = async () => {
    setLoading(true);
    setError(null);

    try {
      const result = await SessionsApi.getSessions();
      if (result.error) {
        setError(result.error);
      } else {
        setSessions(result.data || []);
      }
    } catch (err) {
      setError("Failed to refresh sessions");
    } finally {
      setLoading(false);
    }
  };

  // Transform API data to DetailedSession format
  const transformToDetailedSession = (session: SessionData) => ({
    id: session.id,
    date: session.session_date,
    sessionType: session.session_type,
    duration: session.duration_minutes,
    performanceScore: session.performance_score,
    portionDetails: {
      surahName: session.surah_name,
      ayahStart: session.ayah_start,
      ayahEnd: session.ayah_end,
      juzNumber: session.juz_number,
      pagesRead: session.pages_read,
      recencyCategory:
        (session.recency_category as
          | "new"
          | "recent"
          | "reviewing"
          | "maintenance") || "recent",
    },
    sessionGoal: session.session_goal,
    additionalNotes: session.additional_notes,
    mistakes:
      session.mistakes?.map((m) => ({
        id: m.id || "",
        errorCategory: m.error_category,
        errorSubcategory: m.error_subcategory || "",
        severityLevel: m.severity_level,
        location: m.location,
        additionalNotes: m.additional_notes || "",
      })) || [],
  });

  // Transform DetailedSession back to API format
  const transformToSessionData = (session: any) => ({
    session_date: session.date,
    session_type: session.sessionType,
    duration_minutes: session.duration,
    surah_name: session.portionDetails.surahName,
    ayah_start: session.portionDetails.ayahStart,
    ayah_end: session.portionDetails.ayahEnd,
    juz_number: session.portionDetails.juzNumber,
    pages_read: session.portionDetails.pagesRead,
    recency_category: session.portionDetails.recencyCategory,
    session_goal: session.sessionGoal,
    performance_score: session.performanceScore,
    additional_notes: session.additionalNotes,
  });

  const handleEditClick = (session: SessionData) => {
    setEditingSession(session);
  };

  const handleSaveEdit = async (updatedSession: any) => {
    try {
      const sessionData = transformToSessionData(updatedSession);
      const mistakes =
        updatedSession.mistakes?.map((m: any) => ({
          error_category: m.errorCategory,
          error_subcategory: m.errorSubcategory,
          severity_level: m.severityLevel,
          location: m.location,
          additional_notes: m.additionalNotes,
        })) || [];

      const result = await SessionsApi.updateSession(
        updatedSession.id,
        sessionData,
        mistakes
      );

      if (result.error) {
        setError(`Failed to update session: ${result.error}`);
      } else {
        // Update the session in our local state
        setSessions((prev) =>
          prev.map((s) => (s.id === updatedSession.id ? result.data! : s))
        );
        setEditingSession(null);
        if (selectedSession?.id === updatedSession.id) {
          setSelectedSession(result.data!);
        }
        // Refresh the list to get the latest data
        await handleRefresh();
      }
    } catch (err) {
      setError("Failed to save changes");
      console.error("Save error:", err);
    }
  };

  const handleDeleteClick = (session: SessionData) => {
    setDeletingSession(session);
  };

  const handleConfirmDelete = async () => {
    if (!deletingSession) return;

    try {
      setIsDeleting(true);
      setError(null);

      const result = await SessionsApi.deleteSession(deletingSession.id);

      if (result.error) {
        setError(`Failed to delete session: ${result.error}`);
      } else {
        // Remove from local state
        setSessions((prev) => prev.filter((s) => s.id !== deletingSession.id));

        // Close any open modals for this session
        if (selectedSession?.id === deletingSession.id) {
          setSelectedSession(null);
        }
        if (editingSession?.id === deletingSession.id) {
          setEditingSession(null);
        }

        setDeletingSession(null);
        // Optionally refresh to ensure consistency
        await handleRefresh();
      }
    } catch (err) {
      setError("Failed to delete session");
      console.error("Delete error:", err);
    } finally {
      setIsDeleting(false);
    }
  };

  const handleCancelDelete = () => {
    setDeletingSession(null);
  };

  // Loading state
  if (loading) {
    return (
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg p-6">
        <div className="flex items-center justify-center py-12">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mr-3"></div>
          <span className="text-gray-600 dark:text-gray-400">
            Loading your sessions...
          </span>
        </div>
      </div>
    );
  }

  // Error state
  if (error) {
    return (
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg p-6">
        <div className="text-center py-12">
          <div className="text-red-500 text-xl mb-4">⚠️</div>
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
            Unable to Load Sessions
          </h3>
          <p className="text-gray-600 dark:text-gray-400 mb-4">{error}</p>
          <button
            onClick={handleRefresh}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
          >
            Try Again
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg">
      {/* Header */}
      <div className="p-6 border-b border-gray-200 dark:border-gray-700">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-xl font-semibold text-gray-900 dark:text-white">
            Your Quran Sessions ({sessions.length})
          </h2>
          <button
            onClick={handleRefresh}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
          >
            🔄 Refresh
          </button>
        </div>

        {/* Search */}
        <div className="relative">
          <input
            type="text"
            placeholder="Search sessions... (surah, type, score, duration, mistakes, date)"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
          />
          <div className="absolute inset-y-0 right-0 flex items-center pr-3">
            <span className="text-gray-400">🔍</span>
          </div>
        </div>
      </div>

      {/* Table */}
      <div className="overflow-x-auto">
        {sortedSessions.length === 0 ? (
          <div className="text-center py-12">
            <div className="text-gray-400 text-4xl mb-4">📚</div>
            <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">
              {searchTerm ? "No matching sessions found" : "No sessions yet"}
            </h3>
            <p className="text-gray-500 dark:text-gray-400">
              {searchTerm
                ? "Try adjusting your search terms"
                : "Start your Quran learning journey by creating your first session!"}
            </p>
          </div>
        ) : (
          <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
            <thead className="bg-gray-50 dark:bg-gray-900">
              <tr>
                <th
                  className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider cursor-pointer hover:bg-gray-100 dark:hover:bg-gray-800"
                  onClick={() => handleSort("session_date")}
                >
                  Date{" "}
                  {sortField === "session_date" &&
                    (sortDirection === "asc" ? "↑" : "↓")}
                </th>
                <th
                  className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider cursor-pointer hover:bg-gray-100 dark:hover:bg-gray-800"
                  onClick={() => handleSort("surah_name")}
                >
                  Surah{" "}
                  {sortField === "surah_name" &&
                    (sortDirection === "asc" ? "↑" : "↓")}
                </th>
                <th
                  className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider cursor-pointer hover:bg-gray-100 dark:hover:bg-gray-800"
                  onClick={() => handleSort("session_type")}
                >
                  Type{" "}
                  {sortField === "session_type" &&
                    (sortDirection === "asc" ? "↑" : "↓")}
                </th>
                <th
                  className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider cursor-pointer hover:bg-gray-100 dark:hover:bg-gray-800"
                  onClick={() => handleSort("duration_minutes")}
                >
                  Duration{" "}
                  {sortField === "duration_minutes" &&
                    (sortDirection === "asc" ? "↑" : "↓")}
                </th>
                <th
                  className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider cursor-pointer hover:bg-gray-100 dark:hover:bg-gray-800"
                  onClick={() => handleSort("performance_score")}
                >
                  Score{" "}
                  {sortField === "performance_score" &&
                    (sortDirection === "asc" ? "↑" : "↓")}
                </th>
                <th
                  className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider cursor-pointer hover:bg-gray-100 dark:hover:bg-gray-800"
                  onClick={() => handleSort("mistakeCount")}
                >
                  Mistakes{" "}
                  {sortField === "mistakeCount" &&
                    (sortDirection === "asc" ? "↑" : "↓")}
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
              {sortedSessions.map((session) => (
                <tr
                  key={session.id}
                  className="hover:bg-gray-50 dark:hover:bg-gray-700 cursor-pointer transition-colors"
                  onClick={() => setSelectedSession(session)}
                >
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-white">
                    {formatDate(session.session_date)}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm font-medium text-gray-900 dark:text-white">
                      {session.surah_name}
                    </div>
                    {session.ayah_start && session.ayah_end && (
                      <div className="text-sm text-gray-500 dark:text-gray-400">
                        Verses {session.ayah_start}-{session.ayah_end}
                      </div>
                    )}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-white">
                    {formatSessionType(session.session_type)}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-white">
                    {session.duration_minutes}m
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center">
                      <span
                        className={`text-sm font-medium ${
                          session.performance_score >= 8
                            ? "text-green-600 dark:text-green-400"
                            : session.performance_score >= 6
                            ? "text-yellow-600 dark:text-yellow-400"
                            : "text-red-600 dark:text-red-400"
                        }`}
                      >
                        {session.performance_score}/10
                      </span>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span
                      className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                        (session.mistakes?.length || 0) === 0
                          ? "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200"
                          : (session.mistakes?.length || 0) <= 2
                          ? "bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200"
                          : "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200"
                      }`}
                    >
                      {session.mistakes?.length || 0}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                    <div className="flex space-x-2">
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          setSelectedSession(session);
                        }}
                        className="text-blue-600 hover:text-blue-900 dark:text-blue-400 dark:hover:text-blue-300"
                        title="View session details"
                      >
                        View
                      </button>
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          handleEditClick(session);
                        }}
                        className="text-indigo-600 hover:text-indigo-900 dark:text-indigo-400 dark:hover:text-indigo-300"
                        title="Edit session"
                      >
                        Edit
                      </button>
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          handleDeleteClick(session);
                        }}
                        className="text-red-600 hover:text-red-900 dark:text-red-400 dark:hover:text-red-300"
                        title="Delete session"
                      >
                        Delete
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {/* Session Detail Modal */}
      {selectedSession && (
        <SessionDetail
          session={transformToDetailedSession(selectedSession)}
          onClose={() => setSelectedSession(null)}
          onEdit={(session) => {
            // Find the original SessionData by ID
            const originalSession = sessions.find((s) => s.id === session.id);
            if (originalSession) {
              handleEditClick(originalSession);
            }
          }}
        />
      )}

      {/* Edit Session Modal */}
      {editingSession && (
        <EditSessionModal
          session={transformToDetailedSession(editingSession)}
          onSave={handleSaveEdit}
          onClose={() => setEditingSession(null)}
        />
      )}

      {/* Delete Confirmation Modal */}
      {deletingSession && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white dark:bg-gray-800 rounded-lg p-6 w-full max-w-md mx-4">
            <div className="flex items-center mb-4">
              <div className="text-red-500 text-2xl mr-3">⚠️</div>
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                Delete Session
              </h3>
            </div>

            <div className="mb-6">
              <p className="text-gray-600 dark:text-gray-400 mb-3">
                Are you sure you want to delete this session? This action cannot
                be undone.
              </p>

              <div className="bg-gray-50 dark:bg-gray-700 p-3 rounded-lg">
                <div className="text-sm">
                  <div className="font-medium text-gray-900 dark:text-white">
                    {deletingSession.surah_name} -{" "}
                    {formatSessionType(deletingSession.session_type)}
                  </div>
                  <div className="text-gray-500 dark:text-gray-400">
                    {formatDate(deletingSession.session_date)} •{" "}
                    {deletingSession.duration_minutes}m • Score:{" "}
                    {deletingSession.performance_score}/10
                  </div>
                  {deletingSession.mistakes &&
                    deletingSession.mistakes.length > 0 && (
                      <div className="text-red-600 dark:text-red-400 text-xs mt-1">
                        {deletingSession.mistakes.length} mistake
                        {deletingSession.mistakes.length > 1 ? "s" : ""} will
                        also be deleted
                      </div>
                    )}
                </div>
              </div>
            </div>

            <div className="flex space-x-3">
              <button
                onClick={handleCancelDelete}
                disabled={isDeleting}
                className="flex-1 px-4 py-2 bg-gray-200 text-gray-800 rounded-lg hover:bg-gray-300 disabled:opacity-50 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleConfirmDelete}
                disabled={isDeleting}
                className="flex-1 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 disabled:opacity-50 transition-colors flex items-center justify-center"
              >
                {isDeleting ? (
                  <>
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                    Deleting...
                  </>
                ) : (
                  "Delete"
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
