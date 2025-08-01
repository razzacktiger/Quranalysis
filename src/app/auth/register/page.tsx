"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { signInWithGoogle } from "../../../lib/supabase";

export default function RegisterPage() {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const router = useRouter();

  const handleGoogleSignUp = async () => {
    setIsLoading(true);
    setError("");
    setSuccess("");

    try {
      // Try real Google OAuth first, fallback to simulation
      if (
        process.env.NEXT_PUBLIC_SUPABASE_URL &&
        process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
      ) {
        // Real Supabase Google OAuth (same as login)
        await signInWithGoogle();
        // Redirect will be handled by Supabase callback
      } else {
        // Fallback simulation for development
        const simulatedUser = {
          id: "google-user-new-123",
          email: "newuser@gmail.com",
          full_name: "New Google User",
          access_token: "google-auth-token-new",
        };

        setSuccess("Account created successfully! Redirecting to dashboard...");

        // Store simulated authentication data
        localStorage.setItem("token", simulatedUser.access_token);
        localStorage.setItem("user", JSON.stringify(simulatedUser));

        // Redirect to dashboard after a short delay
        setTimeout(() => {
          router.push("/dashboard");
        }, 1500);
      }
    } catch (err: any) {
      console.error("Google sign-up error:", err);
      setError(err.message || "Google sign-up failed. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-emerald-50 via-teal-50 to-cyan-50 dark:from-emerald-950 dark:via-teal-950 dark:to-cyan-950 flex items-center justify-center px-4 py-8">
      <div className="max-w-md w-full">
        {/* Header */}
        <div className="text-center mb-8">
          <Link
            href="/"
            className="inline-flex items-center space-x-2 text-2xl font-bold text-emerald-800 dark:text-emerald-200 mb-4"
          >
            <span className="text-3xl">📖</span>
            <span>AI Quran Coach</span>
          </Link>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">
            Join Our Community
          </h1>
          <p className="text-gray-600 dark:text-gray-300">
            Sign up with Google to start your AI-powered Quran learning journey
          </p>
        </div>

        {/* Google OAuth Card */}
        <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-xl p-8">
          {error && (
            <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-4 mb-6">
              <p className="text-red-600 dark:text-red-400 text-sm">{error}</p>
            </div>
          )}

          {success && (
            <div className="bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-lg p-4 mb-6">
              <p className="text-green-600 dark:text-green-400 text-sm">
                {success}
              </p>
            </div>
          )}

          {/* Google Sign Up Button */}
          <button
            onClick={handleGoogleSignUp}
            disabled={isLoading}
            className="w-full flex items-center justify-center px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 focus:ring-2 focus:ring-emerald-500 disabled:opacity-50 disabled:cursor-not-allowed transition-colors mb-6"
          >
            {isLoading ? (
              <div className="flex items-center">
                <div className="w-5 h-5 border-2 border-gray-400 border-t-transparent rounded-full animate-spin mr-3"></div>
                Creating account...
              </div>
            ) : (
              <div className="flex items-center">
                <svg className="w-5 h-5 mr-3" viewBox="0 0 24 24">
                  <path
                    fill="#4285F4"
                    d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                  />
                  <path
                    fill="#34A853"
                    d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                  />
                  <path
                    fill="#FBBC05"
                    d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
                  />
                  <path
                    fill="#EA4335"
                    d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
                  />
                </svg>
                Sign up with Google
              </div>
            )}
          </button>

          {/* What You Get */}
          <div className="bg-emerald-50 dark:bg-emerald-900/20 rounded-lg p-4 mb-6">
            <h3 className="font-semibold text-emerald-800 dark:text-emerald-200 mb-3">
              🎯 What you'll get:
            </h3>
            <div className="space-y-2 text-sm text-emerald-700 dark:text-emerald-300">
              <div className="flex items-center">
                <span className="mr-2">🧠</span>
                AI-powered mistake analysis and correction
              </div>
              <div className="flex items-center">
                <span className="mr-2">📊</span>
                Personalized progress tracking and insights
              </div>
              <div className="flex items-center">
                <span className="mr-2">🎯</span>
                Adaptive learning paths for your level
              </div>
              <div className="flex items-center">
                <span className="mr-2">🔊</span>
                Voice recognition for recitation practice
              </div>
            </div>
          </div>

          {/* Divider */}
          <div className="relative my-6">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-gray-300 dark:border-gray-600"></div>
            </div>
            <div className="relative flex justify-center text-sm">
              <span className="px-2 bg-white dark:bg-gray-800 text-gray-500 dark:text-gray-400">
                Safe & Secure
              </span>
            </div>
          </div>

          {/* Privacy Features */}
          <div className="space-y-3 text-sm text-gray-600 dark:text-gray-400">
            <div className="flex items-center">
              <svg
                className="w-4 h-4 text-green-500 mr-2"
                fill="currentColor"
                viewBox="0 0 20 20"
              >
                <path
                  fillRule="evenodd"
                  d="M2.166 4.999A11.954 11.954 0 0010 1.944 11.954 11.954 0 0017.834 5c.11.65.166 1.32.166 2.001 0 5.225-3.34 9.67-8 11.317C5.34 16.67 2 12.225 2 7c0-.682.057-1.35.166-2.001zm11.541 3.708a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
                  clipRule="evenodd"
                />
              </svg>
              Your data is private and secure
            </div>
            <div className="flex items-center">
              <svg
                className="w-4 h-4 text-green-500 mr-2"
                fill="currentColor"
                viewBox="0 0 20 20"
              >
                <path
                  fillRule="evenodd"
                  d="M2.166 4.999A11.954 11.954 0 0010 1.944 11.954 11.954 0 0017.834 5c.11.65.166 1.32.166 2.001 0 5.225-3.34 9.67-8 11.317C5.34 16.67 2 12.225 2 7c0-.682.057-1.35.166-2.001zm11.541 3.708a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
                  clipRule="evenodd"
                />
              </svg>
              No spam, just learning insights
            </div>
            <div className="flex items-center">
              <svg
                className="w-4 h-4 text-green-500 mr-2"
                fill="currentColor"
                viewBox="0 0 20 20"
              >
                <path
                  fillRule="evenodd"
                  d="M2.166 4.999A11.954 11.954 0 0010 1.944 11.954 11.954 0 0017.834 5c.11.65.166 1.32.166 2.001 0 5.225-3.34 9.67-8 11.317C5.34 16.67 2 12.225 2 7c0-.682.057-1.35.166-2.001zm11.541 3.708a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
                  clipRule="evenodd"
                />
              </svg>
              Free to start, premium features available
            </div>
          </div>

          {/* Footer */}
          <div className="mt-8 text-center">
            <p className="text-gray-600 dark:text-gray-300 text-sm">
              Already have an account?{" "}
              <Link
                href="/auth/login"
                className="text-emerald-600 hover:text-emerald-700 font-medium"
              >
                Sign in with Google
              </Link>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
