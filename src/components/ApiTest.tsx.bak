"use client";

import { useState, useEffect } from "react";
import { SessionsApi, SessionData } from "@/lib/api-client";
import { supabase, signInWithGoogle } from "@/lib/supabase";

export default function ApiTest() {
  const [sessions, setSessions] = useState<SessionData[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [user, setUser] = useState<any>(null);
  const [authLoading, setAuthLoading] = useState(true);

  // Check authentication status
  useEffect(() => {
    const checkAuth = async () => {
      const {
        data: { session },
      } = await supabase.auth.getSession();
      setUser(session?.user || null);
      setAuthLoading(false);
    };

    checkAuth();

    // Listen for auth changes
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((event, session) => {
      setUser(session?.user || null);
    });

    return () => subscription.unsubscribe();
  }, []);

  // Handle Google Sign In
  const handleSignIn = async () => {
    try {
      setAuthLoading(true);
      await signInWithGoogle();
    } catch (err) {
      setError("Failed to sign in with Google");
      setAuthLoading(false);
    }
  };

  // Test: Fetch Sessions
  const testGetSessions = async () => {
    setLoading(true);
    setError(null);
    setSuccess(null);

    const result = await SessionsApi.getSessions();

    if (result.error) {
      setError(`❌ GET Sessions Failed: ${result.error}`);
    } else {
      setSessions(result.data || []);
      setSuccess(
        `✅ GET Sessions Success: Found ${result.data?.length || 0} sessions`
      );
    }

    setLoading(false);
  };

  // Test: Create Session (TODO: Update for multi-surah format)
  const testCreateSession = async () => {
    setError(
      "❌ CREATE Session test disabled - needs update for multi-surah format"
    );
  };

  // Test: Create Session with Multiple Mistakes (TODO: Update for multi-surah format)
  const testCreateComplexSession = async () => {
    setError(
      "❌ CREATE Complex Session test disabled - needs update for multi-surah format"
    );
  };

  // Test: Update Session
  const testUpdateSession = async () => {
    if (sessions.length === 0) {
      setError("❌ No sessions to update. Create a session first.");
      return;
    }

    setLoading(true);
    setError(null);
    setSuccess(null);

    const sessionToUpdate = sessions[0]; // Update the first session
    const updatedSession = {
      performance_score: 9, // Improve the score
      additional_notes: "Updated via API test - performance improved!",
      session_goal: "Updated goal: Master Al-Fatiha",
    };

    const result = await SessionsApi.updateSession(
      sessionToUpdate.id,
      updatedSession
    );

    if (result.error) {
      setError(`❌ UPDATE Session Failed: ${result.error}`);
    } else {
      setSuccess(`✅ UPDATE Session Success: Score updated to 9/10`);
      testGetSessions();
    }

    setLoading(false);
  };

  // Test: Delete Session
  const testDeleteSession = async () => {
    if (sessions.length === 0) {
      setError("❌ No sessions to delete. Create a session first.");
      return;
    }

    setLoading(true);
    setError(null);
    setSuccess(null);

    const sessionToDelete = sessions[sessions.length - 1]; // Delete the last session

    const result = await SessionsApi.deleteSession(sessionToDelete.id);

    if (result.error) {
      setError(`❌ DELETE Session Failed: ${result.error}`);
    } else {
      setSuccess(`✅ DELETE Session Success: Session removed`);
      testGetSessions();
    }

    setLoading(false);
  };

  // Show loading during auth check
  if (authLoading) {
    return (
      <div className="max-w-4xl mx-auto p-6 bg-white dark:bg-gray-800 rounded-lg shadow-lg">
        <div className="text-center py-8">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600 dark:text-gray-400">
            Checking authentication...
          </p>
        </div>
      </div>
    );
  }

  // Show login required if not authenticated
  if (!user) {
    return (
      <div className="max-w-4xl mx-auto p-6 bg-white dark:bg-gray-800 rounded-lg shadow-lg">
        <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-6">
          🧪 API Connection Test
        </h2>

        <div className="text-center py-8">
          <div className="mb-6">
            <div className="text-6xl mb-4">🔒</div>
            <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">
              Authentication Required
            </h3>
            <p className="text-gray-600 dark:text-gray-400 mb-6">
              You need to sign in with Google to test the API endpoints. The API
              requires authentication to protect your session data.
            </p>
          </div>

          <button
            onClick={handleSignIn}
            disabled={authLoading}
            className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 transition-colors font-medium"
          >
            {authLoading ? "Signing in..." : "🔐 Sign in with Google"}
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto p-6 bg-white dark:bg-gray-800 rounded-lg shadow-lg">
      <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-6">
        🧪 API Connection Test
      </h2>

      {/* User Info */}
      <div className="mb-6 p-4 bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-lg">
        <div className="flex items-center gap-3">
          <div className="text-green-600 dark:text-green-400">✅</div>
          <div>
            <p className="text-green-800 dark:text-green-200 font-medium">
              Authenticated as: {user.email}
            </p>
            <p className="text-green-600 dark:text-green-400 text-sm">
              Ready to test API endpoints
            </p>
          </div>
        </div>
      </div>

      {/* Test Buttons */}
      <div className="grid grid-cols-2 lg:grid-cols-3 gap-3 mb-6">
        <button
          onClick={testGetSessions}
          disabled={loading}
          className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 transition-colors font-medium"
        >
          {loading ? "⏳ Loading..." : "📥 GET Sessions"}
        </button>

        <button
          onClick={testCreateSession}
          disabled={loading}
          className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50 transition-colors font-medium"
        >
          {loading ? "⏳ Creating..." : "➕ CREATE Simple"}
        </button>

        <button
          onClick={testCreateComplexSession}
          disabled={loading}
          className="px-4 py-2 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 disabled:opacity-50 transition-colors font-medium"
        >
          {loading ? "⏳ Creating..." : "🔥 CREATE Complex"}
        </button>

        <button
          onClick={testUpdateSession}
          disabled={loading || sessions.length === 0}
          className="px-4 py-2 bg-amber-600 text-white rounded-lg hover:bg-amber-700 disabled:opacity-50 transition-colors font-medium"
        >
          {loading ? "⏳ Updating..." : "✏️ UPDATE Session"}
        </button>

        <button
          onClick={testDeleteSession}
          disabled={loading || sessions.length === 0}
          className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 disabled:opacity-50 transition-colors font-medium"
        >
          {loading ? "⏳ Deleting..." : "🗑️ DELETE Session"}
        </button>

        <button
          onClick={() => {
            setSessions([]);
            setError(null);
            setSuccess(null);
          }}
          disabled={loading}
          className="px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 disabled:opacity-50 transition-colors font-medium"
        >
          🧹 Clear Display
        </button>
      </div>

      {/* Status Messages */}
      {error && (
        <div className="mb-4 p-4 bg-red-100 border border-red-400 text-red-700 rounded-lg">
          {error}
        </div>
      )}

      {success && (
        <div className="mb-4 p-4 bg-green-100 border border-green-400 text-green-700 rounded-lg">
          {success}
        </div>
      )}

      {/* Sessions Display */}
      <div className="border border-gray-200 dark:border-gray-700 rounded-lg p-4">
        <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
          📊 Sessions from Database ({sessions.length})
        </h3>

        {sessions.length === 0 ? (
          <p className="text-gray-500 dark:text-gray-400 italic">
            No sessions found. Create a test session to see data here.
          </p>
        ) : (
          <div className="space-y-3">
            {sessions.map((session) => (
              <div
                key={session.id}
                className="p-3 bg-gray-50 dark:bg-gray-700 rounded-lg"
              >
                <div className="flex justify-between items-start">
                  <div>
                    <h4 className="font-medium text-gray-900 dark:text-white">
                      Session - {session.session_type}
                    </h4>
                    <p className="text-sm text-gray-600 dark:text-gray-400">
                      Date:{" "}
                      {new Date(session.session_date).toLocaleDateString()} |
                      Duration: {session.duration_minutes}m | Score:{" "}
                      {session.performance_score}/10
                    </p>
                    <p className="text-sm text-gray-600 dark:text-gray-400">
                      Mistakes: 0 (TODO: Update for multi-surah format)
                    </p>
                  </div>
                  <span className="text-xs text-gray-500 bg-gray-200 dark:bg-gray-600 px-2 py-1 rounded">
                    ID: {session.id.slice(0, 8)}...
                  </span>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Debug Info */}
      <div className="mt-6 p-4 bg-gray-100 dark:bg-gray-700 rounded-lg">
        <h4 className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">
          🔍 Debug Info
        </h4>
        <p className="text-xs text-gray-600 dark:text-gray-400">
          Project: scqseishklizofqtddxr.supabase.co
          <br />
          Environment: {process.env.NODE_ENV}
          <br />
          API Base: {window.location.origin}/api
        </p>
      </div>
    </div>
  );
}
