"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { SessionsApi, SessionData } from "@/lib/api-client";
import { supabase, signOut } from "@/lib/supabase";
import SessionsTableReal from "@/components/SessionsTableReal";
import CreateSessionModal from "@/components/CreateSessionModal";
import AIChat from "@/components/AIChat";

interface User {
  id: string;
  email: string;
  name?: string;
}

interface Stats {
  totalSessions: number;
  averagePerformance: number;
  totalMistakes: number;
  improvementTrend: string;
  recentSessions: number;
  favoriteSupah: string;
  totalDuration: number;
}

export default function RealDashboardPage() {
  const [user, setUser] = useState<User | null>(null);
  const [stats, setStats] = useState<Stats>({
    totalSessions: 0,
    averagePerformance: 0,
    totalMistakes: 0,
    improvementTrend: "stable",
    recentSessions: 0,
    favoriteSupah: "None",
    totalDuration: 0,
  });
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [isCreating, setIsCreating] = useState(false);
  const [createError, setCreateError] = useState<string | null>(null);
  const [showAIAssistant, setShowAIAssistant] = useState(false);
  const router = useRouter();

  useEffect(() => {
    const checkAuthAndLoadData = async () => {
      try {
        setIsLoading(true);
        setError(null);

        // Check authentication
        const {
          data: { session },
        } = await supabase.auth.getSession();

        if (!session?.user) {
          router.push("/auth/login");
          return;
        }

        setUser({
          id: session.user.id,
          email: session.user.email || "",
          name: session.user.user_metadata?.full_name,
        });

        // Fetch sessions and calculate stats
        await fetchStats();
      } catch (err) {
        console.error("Dashboard load error:", err);
        setError("Failed to load dashboard data");
      } finally {
        setIsLoading(false);
      }
    };

    checkAuthAndLoadData();

    // Listen for auth changes
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((event, session) => {
      if (event === "SIGNED_OUT" || !session) {
        router.push("/auth/login");
      } else if (event === "SIGNED_IN" && session?.user) {
        setUser({
          id: session.user.id,
          email: session.user.email || "",
          name: session.user.user_metadata?.full_name,
        });
        fetchStats();
      }
    });

    return () => subscription.unsubscribe();
  }, [router]);

  const fetchStats = async () => {
    try {
      const result = await SessionsApi.getSessions();

      if (result.error) {
        setError(result.error);
        return;
      }

      const sessions = result.data || [];
      calculateStats(sessions);
    } catch (err) {
      console.error("Stats fetch error:", err);
      setError("Failed to load statistics");
    }
  };

  const calculateStats = (sessions: SessionData[]) => {
    if (sessions.length === 0) {
      setStats({
        totalSessions: 0,
        averagePerformance: 0,
        totalMistakes: 0,
        improvementTrend: "stable",
        recentSessions: 0,
        favoriteSupah: "None",
        totalDuration: 0,
      });
      return;
    }

    // Calculate basic stats
    const totalSessions = sessions.length;
    const totalMistakes = sessions.reduce(
      (sum, s) => sum + (s.mistakes?.length || 0),
      0
    );
    const averagePerformance =
      sessions.reduce((sum, s) => sum + s.performance_score, 0) / totalSessions;
    const totalDuration = sessions.reduce(
      (sum, s) => sum + s.duration_minutes,
      0
    );

    // Recent sessions (last 7 days)
    const weekAgo = new Date();
    weekAgo.setDate(weekAgo.getDate() - 7);
    const recentSessions = sessions.filter(
      (s) => new Date(s.session_date) > weekAgo
    ).length;

    // Most frequent surah
    const surahCounts = sessions.reduce((acc, s) => {
      acc[s.surah_name] = (acc[s.surah_name] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

    const favoriteSupah =
      Object.entries(surahCounts).sort(([, a], [, b]) => b - a)[0]?.[0] ||
      "None";

    // Improvement trend (compare recent vs older performance)
    const halfIndex = Math.floor(sessions.length / 2);
    const sortedByDate = [...sessions].sort(
      (a, b) =>
        new Date(a.session_date).getTime() - new Date(b.session_date).getTime()
    );

    let improvementTrend = "stable";
    if (sessions.length > 4) {
      const recentAvg =
        sortedByDate
          .slice(-halfIndex)
          .reduce((sum, s) => sum + s.performance_score, 0) / halfIndex;
      const olderAvg =
        sortedByDate
          .slice(0, halfIndex)
          .reduce((sum, s) => sum + s.performance_score, 0) / halfIndex;

      if (recentAvg > olderAvg + 0.5) improvementTrend = "improving";
      else if (recentAvg < olderAvg - 0.5) improvementTrend = "declining";
    }

    setStats({
      totalSessions,
      averagePerformance: Math.round(averagePerformance * 10) / 10,
      totalMistakes,
      improvementTrend,
      recentSessions,
      favoriteSupah,
      totalDuration,
    });
  };

  const handleCreateSession = async (newSession: any) => {
    try {
      setIsCreating(true);
      setCreateError(null);

      // Transform the session data to match the API format
      const sessionData = {
        session_date: newSession.date,
        session_type: newSession.sessionType,
        duration_minutes: newSession.duration,
        surah_name: newSession.portionDetails.surahName,
        ayah_start: newSession.portionDetails.ayahStart,
        ayah_end: newSession.portionDetails.ayahEnd,
        juz_number: newSession.portionDetails.juzNumber,
        pages_read: newSession.portionDetails.pagesRead,
        recency_category: newSession.portionDetails.recencyCategory,
        session_goal: newSession.sessionGoal,
        performance_score: newSession.performanceScore,
        additional_notes: newSession.additionalNotes,
      };

      // Transform mistakes data
      const mistakes =
        newSession.mistakes?.map((m: any) => ({
          error_category: m.errorCategory,
          error_subcategory: m.errorSubcategory,
          severity_level: m.severityLevel,
          location: m.location,
          additional_notes: m.additionalNotes,
        })) || [];

      const result = await SessionsApi.createSession(sessionData, mistakes);

      if (result.error) {
        setCreateError(`Failed to create session: ${result.error}`);
      } else {
        // Success! Close modal and refresh data
        setShowCreateModal(false);
        // Refresh stats to reflect the new session
        fetchStats();
      }
    } catch (err) {
      setCreateError("Failed to create session. Please try again.");
      console.error("Create session error:", err);
    } finally {
      setIsCreating(false);
    }
  };

  const handleSignOut = async () => {
    try {
      await signOut();
      router.push("/");
    } catch (err) {
      console.error("Sign out error:", err);
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600 dark:text-gray-400">
            Loading your dashboard...
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      {/* Header */}
      <div className="bg-white dark:bg-gray-800 shadow">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-6">
            <div>
              <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
                Quranalysis: Dashboard
              </h1>
              <p className="text-gray-600 dark:text-gray-400">
                Welcome back, {user?.name || user?.email}
              </p>
            </div>
            <div className="flex items-center space-x-4">
              <button
                onClick={fetchStats}
                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
              >
                🔄 Refresh
              </button>
              <button
                onClick={handleSignOut}
                className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors"
              >
                Sign Out
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
        {error && (
          <div className="mb-6 bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded">
            {error}
          </div>
        )}

        {/* Stats Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          {/* Total Sessions */}
          <div className="bg-white dark:bg-gray-800 overflow-hidden shadow rounded-lg">
            <div className="p-5">
              <div className="flex items-center">
                <div className="flex-shrink-0">
                  <div className="text-2xl">📚</div>
                </div>
                <div className="ml-5 w-0 flex-1">
                  <dl>
                    <dt className="text-sm font-medium text-gray-500 dark:text-gray-400 truncate">
                      Total Sessions
                    </dt>
                    <dd className="text-lg font-medium text-gray-900 dark:text-white">
                      {stats.totalSessions}
                    </dd>
                  </dl>
                </div>
              </div>
            </div>
          </div>

          {/* Average Performance */}
          <div className="bg-white dark:bg-gray-800 overflow-hidden shadow rounded-lg">
            <div className="p-5">
              <div className="flex items-center">
                <div className="flex-shrink-0">
                  <div className="text-2xl">⭐</div>
                </div>
                <div className="ml-5 w-0 flex-1">
                  <dl>
                    <dt className="text-sm font-medium text-gray-500 dark:text-gray-400 truncate">
                      Avg Performance
                    </dt>
                    <dd className="text-lg font-medium text-gray-900 dark:text-white">
                      {stats.averagePerformance}/10
                    </dd>
                  </dl>
                </div>
              </div>
            </div>
          </div>

          {/* Total Duration */}
          <div className="bg-white dark:bg-gray-800 overflow-hidden shadow rounded-lg">
            <div className="p-5">
              <div className="flex items-center">
                <div className="flex-shrink-0">
                  <div className="text-2xl">⏱️</div>
                </div>
                <div className="ml-5 w-0 flex-1">
                  <dl>
                    <dt className="text-sm font-medium text-gray-500 dark:text-gray-400 truncate">
                      Total Duration
                    </dt>
                    <dd className="text-lg font-medium text-gray-900 dark:text-white">
                      {Math.round((stats.totalDuration / 60) * 10) / 10}h
                    </dd>
                  </dl>
                </div>
              </div>
            </div>
          </div>

          {/* Improvement Trend */}
          <div className="bg-white dark:bg-gray-800 overflow-hidden shadow rounded-lg">
            <div className="p-5">
              <div className="flex items-center">
                <div className="flex-shrink-0">
                  <div className="text-2xl">
                    {stats.improvementTrend === "improving"
                      ? "📈"
                      : stats.improvementTrend === "declining"
                      ? "📉"
                      : "📊"}
                  </div>
                </div>
                <div className="ml-5 w-0 flex-1">
                  <dl>
                    <dt className="text-sm font-medium text-gray-500 dark:text-gray-400 truncate">
                      Progress
                    </dt>
                    <dd
                      className={`text-lg font-medium capitalize ${
                        stats.improvementTrend === "improving"
                          ? "text-green-600 dark:text-green-400"
                          : stats.improvementTrend === "declining"
                          ? "text-red-600 dark:text-red-400"
                          : "text-gray-900 dark:text-white"
                      }`}
                    >
                      {stats.improvementTrend}
                    </dd>
                  </dl>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Additional Stats */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow">
            <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">
              Recent Activity
            </h3>
            <p className="text-2xl font-bold text-blue-600 dark:text-blue-400">
              {stats.recentSessions}
            </p>
            <p className="text-sm text-gray-500 dark:text-gray-400">
              sessions this week
            </p>
          </div>

          <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow">
            <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">
              Total Mistakes
            </h3>
            <p className="text-2xl font-bold text-amber-600 dark:text-amber-400">
              {stats.totalMistakes}
            </p>
            <p className="text-sm text-gray-500 dark:text-gray-400">
              areas for improvement
            </p>
          </div>

          <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow">
            <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">
              Favorite Surah
            </h3>
            <p className="text-lg font-bold text-emerald-600 dark:text-emerald-400">
              {stats.favoriteSupah}
            </p>
            <p className="text-sm text-gray-500 dark:text-gray-400">
              most practiced
            </p>
          </div>
        </div>

        {/* Sessions Section with Create Button */}
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg">
          <div className="flex items-center justify-between p-6 border-b border-gray-200 dark:border-gray-700">
            <h2 className="text-xl font-semibold text-gray-900 dark:text-white">
              Your Quran Sessions ({stats?.totalSessions || 0})
            </h2>
            <div className="flex space-x-3">
              <button
                onClick={() => setShowAIAssistant(true)}
                className="flex items-center px-4 py-2 bg-gradient-to-r from-emerald-600 to-emerald-700 text-white rounded-lg hover:from-emerald-700 hover:to-emerald-800 transition-colors shadow-sm"
              >
                <span className="text-lg mr-2">🤖</span>
                AI Assistant
              </button>
              <button
                onClick={() => setShowCreateModal(true)}
                className="flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors shadow-sm"
              >
                <span className="text-lg mr-2">+</span>
                Manual Entry
              </button>
            </div>
          </div>

          <div className="p-6">
            {createError && (
              <div className="mb-4 p-3 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg">
                <p className="text-red-700 dark:text-red-400 text-sm">
                  {createError}
                </p>
              </div>
            )}
            <SessionsTableReal />
          </div>
        </div>
      </div>

      {/* Create Session Modal */}
      {showCreateModal && (
        <CreateSessionModal
          onSave={handleCreateSession}
          onClose={() => {
            setShowCreateModal(false);
            setCreateError(null);
          }}
          isLoading={isCreating}
        />
      )}

      {/* AI Assistant Modal */}
      {showAIAssistant && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-xl w-full max-w-4xl mx-4 h-[80vh] overflow-hidden">
            {/* Header */}
            <div className="flex items-center justify-between p-6 border-b border-gray-200 dark:border-gray-700">
              <div className="flex items-center">
                <div className="text-2xl mr-3">🤖</div>
                <h2 className="text-xl font-semibold text-gray-900 dark:text-white">
                  AI Session Assistant
                </h2>
              </div>
              <button
                onClick={() => setShowAIAssistant(false)}
                className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 p-2"
              >
                ✕
              </button>
            </div>

            {/* AI Chat Content */}
            <div className="h-full">
              <AIChat />
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
