"use client";

import { useEffect, useState, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { supabase } from "../../../lib/supabase";

// Force dynamic rendering to avoid prerendering issues with auth
export const dynamic = 'force-dynamic';

function AuthCallbackContent() {
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState("");
  const [debugInfo, setDebugInfo] = useState("");
  const router = useRouter();
  const searchParams = useSearchParams();

  useEffect(() => {
    const handleAuthCallback = async () => {
      try {
        console.log("Auth callback started...");

        // Check for error in URL params first
        const error_code = searchParams?.get("error");
        const error_description = searchParams?.get("error_description");

        if (error_code) {
          console.error("OAuth error from URL:", error_code, error_description);
          setError(`Authentication failed: ${error_description || error_code}`);
          return;
        }

        // Get the session from the URL hash/fragment
        const { data, error } = await supabase.auth.getSession();

        console.log("Session data:", data);
        console.log("Session error:", error);

        if (error) {
          console.error("Supabase session error:", error);
          setError(`Session error: ${error.message}`);
          return;
        }

        if (data.session && data.session.user) {
          console.log("Valid session found:", data.session.user);

          // Store user data
          const user = data.session.user;
          const userData = {
            id: user.id,
            email: user.email || "",
            full_name:
              user.user_metadata?.full_name ||
              user.user_metadata?.name ||
              user.email ||
              "Unknown User",
            access_token: data.session.access_token,
          };

          console.log("Storing user data:", userData);

          localStorage.setItem("token", data.session.access_token);
          localStorage.setItem("user", JSON.stringify(userData));

          setDebugInfo("✅ Authentication successful! Redirecting...");

          // Small delay to show success message
          setTimeout(() => {
            router.push("/dashboard");
          }, 1000);
        } else {
          console.log("No session found, checking for auth hash...");

          // Try to handle the auth hash manually
          const hashParams = new URLSearchParams(
            window.location.hash.substring(1)
          );
          const access_token = hashParams.get("access_token");

          if (access_token) {
            console.log("Found access token in hash, setting session...");
            setDebugInfo("🔄 Processing authentication...");

            // Wait a bit more for Supabase to process
            setTimeout(() => {
              window.location.reload();
            }, 1000);
          } else {
            setError(
              "No authentication session found. Please try signing in again."
            );
          }
        }
      } catch (err) {
        console.error("Callback error:", err);
        setError(
          `Unexpected error: ${
            err instanceof Error ? err.message : "Unknown error"
          }`
        );
      } finally {
        setIsLoading(false);
      }
    };

    handleAuthCallback();
  }, [router, searchParams]);

  if (error) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center px-4">
        <div className="max-w-md w-full text-center">
          <div className="bg-red-50 dark:bg-red-900/20 rounded-xl p-8">
            <div className="text-red-600 dark:text-red-400 text-4xl mb-4">
              ⚠️
            </div>
            <h1 className="text-xl font-semibold text-red-800 dark:text-red-200 mb-2">
              Authentication Error
            </h1>
            <p className="text-red-600 dark:text-red-400 mb-6 text-sm">
              {error}
            </p>
            <div className="space-y-3">
              <button
                onClick={() => router.push("/auth/login")}
                className="w-full px-6 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors"
              >
                Try Again
              </button>
              <button
                onClick={() => {
                  localStorage.clear();
                  router.push("/auth/login");
                }}
                className="w-full px-6 py-2 border border-red-600 text-red-600 rounded-lg hover:bg-red-50 transition-colors text-sm"
              >
                Clear Data & Retry
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center px-4">
      <div className="max-w-md w-full text-center">
        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-8">
          <div className="text-emerald-600 dark:text-emerald-400 text-4xl mb-4">
            📖
          </div>
          <h1 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">
            {isLoading ? "Completing Sign In..." : "Authentication Success!"}
          </h1>
          <p className="text-gray-600 dark:text-gray-400 mb-6">
            {debugInfo ||
              "Please wait while we set up your AI Quran Coach account."}
          </p>
          <div className="flex items-center justify-center space-x-2">
            <div className="w-2 h-2 bg-emerald-600 rounded-full animate-bounce"></div>
            <div
              className="w-2 h-2 bg-emerald-600 rounded-full animate-bounce"
              style={{ animationDelay: "0.1s" }}
            ></div>
            <div
              className="w-2 h-2 bg-emerald-600 rounded-full animate-bounce"
              style={{ animationDelay: "0.2s" }}
            ></div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function AuthCallback() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center px-4">
          <div className="max-w-md w-full text-center">
            <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-8">
              <div className="text-emerald-600 dark:text-emerald-400 text-4xl mb-4">
                📖
              </div>
              <h1 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">
                Loading...
              </h1>
              <p className="text-gray-600 dark:text-gray-400 mb-6">
                Please wait while we set up your authentication.
              </p>
            </div>
          </div>
        </div>
      }
    >
      <AuthCallbackContent />
    </Suspense>
  );
}
