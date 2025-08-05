# Quranalysis - AI Quran Coach

Your AI-powered Quran memorization and practice companion.

## Features

- **Session Management**: Track your Quran practice sessions with detailed analytics
- **Mistake Tracking**: Record and categorize mistakes for targeted improvement
- **AI Chatbot**: Get personalized guidance and session logging assistance
- **Multi-Portion Support**: Practice multiple surahs in a single session
- **Performance Analytics**: Monitor your progress over time

## Tech Stack

- **Frontend**: Next.js 15, React, TypeScript, Tailwind CSS
- **Backend**: Next.js API Routes
- **Database**: Supabase (PostgreSQL)
- **Authentication**: Supabase Auth with Google OAuth
- **AI**: Google Gemini (GenAI)

## Environment Variables

The following environment variables are required:

- `NEXT_PUBLIC_SUPABASE_URL`: Your Supabase project URL
- `NEXT_PUBLIC_SUPABASE_ANON_KEY`: Your Supabase anonymous key
- `SUPABASE_SERVICE_ROLE_KEY`: Your Supabase service role key
- `GOOGLE_GENAI_API_KEY`: Your Google Gemini API key

## Development

```bash
npm install
npm run dev
```

## Deployment

This project is configured for deployment on Vercel with automatic environment variable management.

---

_Last updated: August 2025 - Ready for production deployment with environment variables configured_
