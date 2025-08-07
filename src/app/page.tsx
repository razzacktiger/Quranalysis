import Link from "next/link";

export default function Home() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-emerald-50 via-teal-50 to-cyan-50 dark:from-emerald-950 dark:via-teal-950 dark:to-cyan-950">
      {/* Navigation */}
      <nav className="flex justify-between items-center p-6 max-w-7xl mx-auto">
        <div className="flex items-center space-x-2">
          <div className="text-2xl">📖</div>
          <span className="text-xl font-bold text-emerald-800 dark:text-emerald-200">
            AI Quran Coach
          </span>
        </div>
        <div className="flex space-x-4">
          <Link
            href="/auth/login"
            className="px-4 py-2 text-emerald-700 hover:text-emerald-900 dark:text-emerald-300 dark:hover:text-emerald-100 transition-colors"
          >
            Login
          </Link>
          <Link
            href="/auth/register"
            className="px-6 py-2 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 transition-colors"
          >
            Get Started
          </Link>
        </div>
      </nav>

      {/* Hero Section */}
      <main className="max-w-7xl mx-auto px-6 py-16">
        <div className="text-center mb-16">
          <h1 className="text-5xl md:text-6xl font-bold text-gray-900 dark:text-white mb-6">
            Your AI-Powered
            <span className="text-emerald-600 dark:text-emerald-400">
              {" "}
              Quran Coach
            </span>
          </h1>
          <p className="text-xl text-gray-600 dark:text-gray-300 mb-8 max-w-3xl mx-auto">
            Master Quran memorization and recitation with intelligent AI
            feedback, personalized mistake analysis, and adaptive learning
            paths.
          </p>

          <div className="flex flex-col sm:flex-row gap-4 justify-center items-center">
            <Link
              href="/auth/register"
              className="px-8 py-4 bg-emerald-600 text-white text-lg font-semibold rounded-xl hover:bg-emerald-700 transition-colors shadow-lg"
            >
              Start Learning Today
            </Link>
            <Link
              href="/dashboard"
              className="px-8 py-4 border-2 border-emerald-600 text-emerald-600 text-lg font-semibold rounded-xl hover:bg-emerald-50 dark:hover:bg-emerald-900 transition-colors"
            >
              View Dashboard
            </Link>
          </div>
        </div>

        {/* Features Section */}
        <div className="grid md:grid-cols-3 gap-8 mt-20">
          <div className="text-center p-6 bg-white dark:bg-gray-800 rounded-xl shadow-lg">
            <div className="text-4xl mb-4">🧠</div>
            <h3 className="text-xl font-semibold mb-3 text-gray-900 dark:text-white">
              AI Analysis
            </h3>
            <p className="text-gray-600 dark:text-gray-300">
              Get detailed feedback on your recitation with intelligent mistake
              detection and correction suggestions.
            </p>
          </div>

          <div className="text-center p-6 bg-white dark:bg-gray-800 rounded-xl shadow-lg">
            <div className="text-4xl mb-4">📊</div>
            <h3 className="text-xl font-semibold mb-3 text-gray-900 dark:text-white">
              Progress Tracking
            </h3>
            <p className="text-gray-600 dark:text-gray-300">
              Monitor your memorization journey with detailed analytics and
              personalized improvement insights.
            </p>
          </div>

          <div className="text-center p-6 bg-white dark:bg-gray-800 rounded-xl shadow-lg">
            <div className="text-4xl mb-4">🎯</div>
            <h3 className="text-xl font-semibold mb-3 text-gray-900 dark:text-white">
              Adaptive Learning
            </h3>
            <p className="text-gray-600 dark:text-gray-300">
              Experience personalized learning paths that adapt to your pace and
              focus on your specific needs.
            </p>
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="bg-gray-50 dark:bg-gray-900 mt-20 py-12">
        <div className="max-w-7xl mx-auto px-6 text-center">
          <p className="text-gray-600 dark:text-gray-400">
            Built with modern technology to enhance your Quran learning journey
          </p>
        </div>
      </footer>
    </div>
  );
}
