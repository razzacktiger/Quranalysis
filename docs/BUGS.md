# Bug & Issue Log

Found during the repo audit (`learn/repo-audit`). Add new entries at the top.

Format: ID | Date | Severity (low/med/high) | Status (open/fixed/wontfix)

---

## BUG-001: Dashboard flashes before redirecting logged-out users

- **Date:** 2026-06-10
- **Severity:** med (UX flaw, no data leak)
- **Status:** open
- **Where:** `src/app/dashboard/page.tsx`

**Symptom:** Visiting `/dashboard` while logged out briefly shows the dashboard UI, then redirects to `/auth/login`.

**Cause:** The page is a Client Component. The auth check (`supabase.auth.getSession()`) runs inside `useEffect`, which only fires *after* React's first paint. So the page always renders once before the redirect can happen.

**Why no data leaks:** Real session data is only fetched after the auth check passes; the flash shows the loading skeleton only.

**Fix options (for refactor phase, not now):**
1. `middleware.ts` — check auth server-side before the page is sent (no flash).
2. `@supabase/ssr` — store session in cookies, redirect from a Server Component.
