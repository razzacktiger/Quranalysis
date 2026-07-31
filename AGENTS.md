# AGENTS.md

## Cursor Cloud specific instructions

### Product overview

**Quranalysis** (AI Quran Coach) is a single **Next.js 15** app (App Router) with colocated API routes. There is no separate backend process or Docker Compose stack in this repo.

### Services

| Service | Port | Required for |
|---------|------|----------------|
| Next.js dev (`npm run dev`) | 3000 | All local development |

External (hosted): **Supabase** (Postgres + Auth + Google OAuth) and optionally **Google Gemini** (`GEMINI_API_KEY`) for `/api/ai/chat`.

### Commands

See `README.md` and `package.json` for standard commands:

- Install: `npm install`
- Dev: `npm run dev` (Turbopack)
- Lint: `npm run lint`
- Build: `npm run build`
- Start production build: `npm run start`

There is **no** automated test script (`npm test` does not exist). Manual QA is described in `TESTING_PLAN.md`.

### Environment variables

Create `.env.local` in the repo root (gitignored). Required for full auth + session CRUD + dashboard:

- `NEXT_PUBLIC_SUPABASE_URL`
- `NEXT_PUBLIC_SUPABASE_ANON_KEY`
- `SUPABASE_SERVICE_ROLE_KEY`

Optional (AI coach only):

- `GEMINI_API_KEY` — the code uses this name; README mentions `GOOGLE_GENAI_API_KEY` but that name is **not** read by the app.

Without Supabase vars, the login page shows **Demo Mode** and simulates Google sign-in via `localStorage`, but **`/dashboard` still requires a real Supabase session** (`supabase.auth.getSession()`), so dashboard/API session flows need configured secrets.

Supabase setup: apply schema from `table-restructure-only.sql`, enable Google OAuth, and add redirect `http://localhost:3000/auth/callback`.

### Dev server startup

Use a persistent tmux session for `npm run dev` so the process survives backgrounding:

```bash
SESSION_NAME="nextjs-dev"
tmux -f /exec-daemon/tmux.portal.conf has-session -t "=$SESSION_NAME" 2>/dev/null \
  || tmux -f /exec-daemon/tmux.portal.conf new-session -d -s "$SESSION_NAME" -c /workspace -- "${SHELL:-bash}" -l
tmux -f /exec-daemon/tmux.portal.conf send-keys -t "$SESSION_NAME:0.0" 'cd /workspace && npm run dev' C-m
```

### Useful routes without full backend

- `/` — marketing landing
- `/test-components` — session cards/table with sample data (no auth)
- `/api/sessions` — returns `401` with `{"error":"Unauthorized - No auth header"}` when unauthenticated (confirms API routing)

### Gotchas

- `better-sqlite3` is a native dependency used by offline `scripts/` tooling; `npm install` must succeed for those scripts, but the web app runtime does not need SQLite.
- After dependency changes, restart `npm run dev`; Turbopack HMR may not always pick up all native/module graph changes.
- Legacy `dashboard-old-backup` and `SessionForm` reference `localhost:8000`; the active app uses Next.js API routes only.
