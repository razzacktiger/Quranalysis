"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import AIChat from "../../components/AIChat";
import SessionForm from "../../components/SessionForm";

interface User {
  id: string;
  email: string;
  full_name?: string;
}

export default function DashboardPage() {
  const [user, setUser] = useState<User | null>(null);
  const [stats, setStats] = useState({
    totalSessions: 0,
    averagePerformance: 0,
    totalMistakes: 0,
    improvementTrend: "stable",
  });
  const [isLoading, setIsLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<"chat" | "stats" | "new-session">(
    "chat"
  );
  const [isSubmittingSession, setIsSubmittingSession] = useState(false);
  const [sessionSubmitMessage, setSessionSubmitMessage] = useState<{
    type: "success" | "error";
    text: string;
  } | null>(null);
  const router = useRouter();

  useEffect(() => {
    // Check if user is logged in
    const token = localStorage.getItem("token");
    const userStr = localStorage.getItem("user");

    if (!token || !userStr) {
      router.push("/auth/login");
      return;
    }

    const userData = JSON.parse(userStr);
    setUser(userData);

    // Fetch user statistics (simulated for now)
    fetchStats(token);
  }, [router]);

  const fetchStats = async (token: string) => {
    try {
      // In a real app, this would fetch from your API
      // For now, we'll simulate data
      setTimeout(() => {
        setStats({
          totalSessions: 12,
          averagePerformance: 0.85,
          totalMistakes: 23,
          improvementTrend: "improving",
        });
        setIsLoading(false);
      }, 1000);
    } catch (error) {
      console.error("Failed to fetch stats:", error);
      setIsLoading(false);
    }
  };

  const handleLogout = () => {
    localStorage.removeItem("token");
    localStorage.removeItem("user");
    router.push("/");
  };

  const handleSessionSubmit = async (sessionData: any) => {
    setIsSubmittingSession(true);
    setSessionSubmitMessage(null);

    try {
      const token = localStorage.getItem("token");
      if (!token) {
        throw new Error("Not authenticated");
      }

      // Create session
      const sessionResponse = await fetch(
        "http://localhost:8000/api/sessions/",
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({
            session_type: sessionData.session_type,
            timestamp: sessionData.timestamp, // Include the actual session timestamp
            duration: sessionData.duration,
            performance_score: sessionData.performance_score,
            notes: sessionData.notes,
            goal_description: sessionData.goal_description,
          }),
        }
      );

      if (!sessionResponse.ok) {
        throw new Error("Failed to create session");
      }

      const session = await sessionResponse.json();

      // Create portion details if provided
      if (
        sessionData.surah_name ||
        sessionData.juz_number ||
        sessionData.ayah_start
      ) {
        await fetch(
          `http://localhost:8000/api/sessions/${session.id}/portions`,
          {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
              Authorization: `Bearer ${token}`,
            },
            body: JSON.stringify({
              portion_type: sessionData.juz_number ? "juz" : "surah",
              reference:
                sessionData.surah_name || `Juz ${sessionData.juz_number}`,
              surah_name: sessionData.surah_name,
              juz_number: sessionData.juz_number,
              ayah_start: sessionData.ayah_start,
              ayah_end: sessionData.ayah_end,
              pages_read: sessionData.pages_read,
              recency_category: sessionData.recency_category,
            }),
          }
        );
      }

      // Create mistakes if provided
      if (sessionData.mistakes && sessionData.mistakes.length > 0) {
        for (const mistake of sessionData.mistakes) {
          await fetch(
            `http://localhost:8000/api/sessions/${session.id}/mistakes`,
            {
              method: "POST",
              headers: {
                "Content-Type": "application/json",
                Authorization: `Bearer ${token}`,
              },
              body: JSON.stringify({
                location: mistake.location,
                error_category: mistake.error_category,
                error_subcategory: mistake.error_subcategory || null,
                details: mistake.details || null,
                severity_level: mistake.severity_level,
              }),
            }
          );
        }
      }

      setSessionSubmitMessage({
        type: "success",
        text: `Session created successfully! 🎉 ${
          sessionData.mistakes?.length > 0
            ? `(with ${sessionData.mistakes.length} mistake${
                sessionData.mistakes.length > 1 ? "s" : ""
              })`
            : ""
        }`,
      });

      // Switch back to chat tab after a delay
      setTimeout(() => {
        setActiveTab("chat");
        setSessionSubmitMessage(null);
      }, 2000);
    } catch (error) {
      setSessionSubmitMessage({
        type: "error",
        text: `Failed to create session: ${
          error instanceof Error ? error.message : "Unknown error"
        }`,
      });
    } finally {
      setIsSubmittingSession(false);
    }
  };

  const handleSessionCancel = () => {
    setActiveTab("chat");
    setSessionSubmitMessage(null);
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center">
        <div className="flex items-center space-x-2">
          <div className="w-8 h-8 border-4 border-emerald-600 border-t-transparent rounded-full animate-spin"></div>
          <span className="text-gray-600 dark:text-gray-300">
            Loading dashboard...
          </span>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      {/* Navigation */}
      <nav className="bg-white dark:bg-gray-800 shadow-sm border-b dark:border-gray-700">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center space-x-2">
              <span className="text-2xl">📖</span>
              <span className="text-xl font-bold text-emerald-800 dark:text-emerald-200">
                AI Quran Coach
              </span>
            </div>

            <div className="flex items-center space-x-4">
              <span className="text-gray-700 dark:text-gray-300">
                Welcome, {user?.full_name || user?.email}
              </span>
              <button
                onClick={handleLogout}
                className="px-4 py-2 text-sm text-red-600 hover:text-red-700 dark:text-red-400 dark:hover:text-red-300"
              >
                Logout
              </button>
            </div>
          </div>
        </div>
      </nav>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto py-8 px-4 sm:px-6 lg:px-8">
        {/* Header with Tabs */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-4">
            Quranalysis: AI Quran Coach
          </h1>

          {/* Tab Navigation */}
          <div className="flex space-x-1 bg-gray-100 dark:bg-gray-800 rounded-lg p-1">
            <button
              onClick={() => setActiveTab("chat")}
              className={`px-6 py-2 rounded-md text-sm font-medium transition-colors ${
                activeTab === "chat"
                  ? "bg-white dark:bg-gray-700 text-emerald-600 dark:text-emerald-400 shadow-sm"
                  : "text-gray-600 dark:text-gray-400 hover:text-gray-800 dark:hover:text-gray-200"
              }`}
            >
              🤖 AI Chat Coach
            </button>
            <button
              onClick={() => setActiveTab("stats")}
              className={`px-6 py-2 rounded-md text-sm font-medium transition-colors ${
                activeTab === "stats"
                  ? "bg-white dark:bg-gray-700 text-emerald-600 dark:text-emerald-400 shadow-sm"
                  : "text-gray-600 dark:text-gray-400 hover:text-gray-800 dark:hover:text-gray-200"
              }`}
            >
              📊 Progress & Stats
            </button>
            <button
              onClick={() => setActiveTab("new-session")}
              className={`px-6 py-2 rounded-md text-sm font-medium transition-colors ${
                activeTab === "new-session"
                  ? "bg-white dark:bg-gray-700 text-emerald-600 dark:text-emerald-400 shadow-sm"
                  : "text-gray-600 dark:text-gray-400 hover:text-gray-800 dark:hover:text-gray-200"
              }`}
            >
              ➕ New Session
            </button>
          </div>
        </div>

        {/* Chat Tab */}
        {activeTab === "chat" && (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 h-[600px]">
            {/* AI Chat - Main Feature */}
            <div className="lg:col-span-2">
              <AIChat />
            </div>

            {/* Quick Stats Sidebar */}
            <div className="space-y-6">
              {/* Today's Goal */}
              <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border dark:border-gray-700 p-6">
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
                  🎯 Today's Goal
                </h3>
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-gray-600 dark:text-gray-400">
                      Practice Time
                    </span>
                    <span className="text-sm font-medium text-gray-900 dark:text-white">
                      30 min
                    </span>
                  </div>
                  <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2">
                    <div className="bg-emerald-600 h-2 rounded-full w-3/4"></div>
                  </div>
                  <p className="text-xs text-gray-500 dark:text-gray-400">
                    22 minutes completed
                  </p>
                </div>
              </div>

              {/* Quick Stats */}
              <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border dark:border-gray-700 p-6">
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
                  📈 Quick Stats
                </h3>
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center">
                      <span className="text-xl mr-2">📚</span>
                      <span className="text-sm text-gray-600 dark:text-gray-400">
                        Sessions
                      </span>
                    </div>
                    <span className="font-bold text-gray-900 dark:text-white">
                      {stats.totalSessions}
                    </span>
                  </div>

                  <div className="flex items-center justify-between">
                    <div className="flex items-center">
                      <span className="text-xl mr-2">📊</span>
                      <span className="text-sm text-gray-600 dark:text-gray-400">
                        Performance
                      </span>
                    </div>
                    <span className="font-bold text-gray-900 dark:text-white">
                      {Math.round(stats.averagePerformance * 100)}%
                    </span>
                  </div>

                  <div className="flex items-center justify-between">
                    <div className="flex items-center">
                      <span className="text-xl mr-2">📈</span>
                      <span className="text-sm text-gray-600 dark:text-gray-400">
                        Trend
                      </span>
                    </div>
                    <span className="font-bold text-emerald-600 dark:text-emerald-400 capitalize">
                      {stats.improvementTrend}
                    </span>
                  </div>
                </div>
              </div>

              {/* Recent Surahs */}
              <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border dark:border-gray-700 p-6">
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
                  📖 Recent Practice
                </h3>
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-gray-900 dark:text-white">
                      Al-Fatiha
                    </span>
                    <span className="text-xs text-gray-500 dark:text-gray-400">
                      2 hours ago
                    </span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-gray-900 dark:text-white">
                      Al-Ikhlas
                    </span>
                    <span className="text-xs text-gray-500 dark:text-gray-400">
                      1 day ago
                    </span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-gray-900 dark:text-white">
                      An-Nas
                    </span>
                    <span className="text-xs text-gray-500 dark:text-gray-400">
                      2 days ago
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Stats Tab */}
        {activeTab === "stats" && (
          <div className="space-y-8">
            {/* Stats Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              {/* Total Sessions */}
              <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border dark:border-gray-700 p-6">
                <div className="flex items-center">
                  <div className="text-2xl text-blue-600 dark:text-blue-400 mr-3">
                    📚
                  </div>
                  <div>
                    <p className="text-sm font-medium text-gray-600 dark:text-gray-400">
                      Total Sessions
                    </p>
                    <p className="text-2xl font-bold text-gray-900 dark:text-white">
                      {stats.totalSessions}
                    </p>
                  </div>
                </div>
              </div>

              {/* Average Performance */}
              <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border dark:border-gray-700 p-6">
                <div className="flex items-center">
                  <div className="text-2xl text-green-600 dark:text-green-400 mr-3">
                    📊
                  </div>
                  <div>
                    <p className="text-sm font-medium text-gray-600 dark:text-gray-400">
                      Avg Performance
                    </p>
                    <p className="text-2xl font-bold text-gray-900 dark:text-white">
                      {Math.round(stats.averagePerformance * 100)}%
                    </p>
                  </div>
                </div>
              </div>

              {/* Total Mistakes */}
              <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border dark:border-gray-700 p-6">
                <div className="flex items-center">
                  <div className="text-2xl text-orange-600 dark:text-orange-400 mr-3">
                    ⚠️
                  </div>
                  <div>
                    <p className="text-sm font-medium text-gray-600 dark:text-gray-400">
                      Areas to Improve
                    </p>
                    <p className="text-2xl font-bold text-gray-900 dark:text-white">
                      {stats.totalMistakes}
                    </p>
                  </div>
                </div>
              </div>

              {/* Improvement Trend */}
              <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border dark:border-gray-700 p-6">
                <div className="flex items-center">
                  <div className="text-2xl text-emerald-600 dark:text-emerald-400 mr-3">
                    📈
                  </div>
                  <div>
                    <p className="text-sm font-medium text-gray-600 dark:text-gray-400">
                      Trend
                    </p>
                    <p className="text-2xl font-bold text-gray-900 dark:text-white capitalize">
                      {stats.improvementTrend}
                    </p>
                  </div>
                </div>
              </div>
            </div>

            {/* Detailed Charts Placeholder */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
              <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border dark:border-gray-700 p-6">
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
                  Practice History
                </h3>
                <div className="h-64 flex items-center justify-center text-gray-500 dark:text-gray-400">
                  📊 Chart will be integrated with real session data
                </div>
              </div>

              <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border dark:border-gray-700 p-6">
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
                  Performance Trends
                </h3>
                <div className="h-64 flex items-center justify-center text-gray-500 dark:text-gray-400">
                  📈 Performance analytics will be shown here
                </div>
              </div>
            </div>
          </div>
        )}

        {/* New Session Tab */}
        {activeTab === "new-session" && (
          <div className="max-w-4xl mx-auto">
            {sessionSubmitMessage && (
              <div
                className={`mb-6 p-4 rounded-lg ${
                  sessionSubmitMessage.type === "success"
                    ? "bg-green-50 border border-green-200 text-green-800 dark:bg-green-900/20 dark:border-green-800 dark:text-green-200"
                    : "bg-red-50 border border-red-200 text-red-800 dark:bg-red-900/20 dark:border-red-800 dark:text-red-200"
                }`}
              >
                {sessionSubmitMessage.text}
              </div>
            )}

            <SessionForm
              onSubmit={handleSessionSubmit}
              onCancel={handleSessionCancel}
              isLoading={isSubmittingSession}
            />
          </div>
        )}

        {/* Instructions Banner */}
        <div className="mt-8 bg-emerald-50 dark:bg-emerald-900/20 rounded-xl p-6 border border-emerald-200 dark:border-emerald-800">
          <div className="flex items-start space-x-3">
            <div className="text-2xl">💡</div>
            <div>
              <h3 className="font-semibold text-emerald-800 dark:text-emerald-200 mb-2">
                How to use your AI Quran Coach
              </h3>
              <p className="text-emerald-700 dark:text-emerald-300 text-sm">
                Simply chat with the AI about your practice sessions! Tell it
                which Surah you practiced, how long you spent, any mistakes you
                noticed, and how you felt about your performance. The AI will
                automatically log your session and provide personalized
                insights.
              </p>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
