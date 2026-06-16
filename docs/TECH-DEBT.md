# Tech Debt Log

Category-level debt only — no line numbers. The live, accurate list is
always `npm run lint`; this file records *what we decided to do about it*.

When a category is fully fixed, flip its ESLint rule from `warn` to `error`
(the "ratchet") so it can't creep back, then mark the entry fixed.

Format: ID | Date found | Effort (S/M/L) | Status (open/in-progress/fixed)

---

## DEBT-001: Widespread `any` types (~60 warnings)

- **GitHub:** #10
- **Date:** 2026-06-11 | **Effort:** L | **Status:** open
- **Rule:** `@typescript-eslint/no-explicit-any`
- **Hotspot:** `src/app/api/ai/chat/route.ts` (~25 of them); rest spread
  across API routes, modals, and `api-client.ts`.
- **Why it matters:** `any` disables type checking — defeats the point of
  TypeScript and hides real bugs at API/data boundaries.
- **Plan:** fix file-by-file during refactor phase, starting with files I'm
  already reading. Define proper types in `src/types/` instead of inline.

## DEBT-002: Unused variables and imports (~25 warnings)

- **GitHub:** #11
- **Date:** 2026-06-11 | **Effort:** S | **Status:** open
- **Rule:** `@typescript-eslint/no-unused-vars`
- **Why it matters:** mostly noise, but some hint at half-finished logic
  (e.g. `userSupabase` in the AI chat route — was per-user auth intended?).
- **Plan:** quick cleanup pass; investigate suspicious ones before deleting.

## DEBT-003: Missing useEffect dependencies (2 warnings)

- **GitHub:** #12
- **Date:** 2026-06-11 | **Effort:** M | **Status:** open
- **Rule:** `react-hooks/exhaustive-deps`
- **Where:** `src/app/dashboard/page.tsx` (`fetchStats`),
  `src/components/SurahSelector.tsx` (`onJuzChange`, `onPagesChange`)
- **Why it matters:** unlike the others, these can cause real bugs — stale
  data or effects not re-running when inputs change. Treat as potential bugs,
  not style.
- **Plan:** understand each effect's intent first (audit), then fix with
  `useCallback` or by restructuring. Don't blindly add deps.

## DEBT-004: Unescaped quotes in JSX (~7 warnings)

- **GitHub:** #13
- **Date:** 2026-06-11 | **Effort:** S | **Status:** open
- **Rule:** `react/no-unescaped-entities`
- **Plan:** mechanical fix (`'` → `&apos;` etc.); safe to batch in one commit.

## DEBT-005: Dead code routes

- **GitHub:** #14
- **Date:** 2026-06-11 | **Effort:** S | **Status:** open
- **Where:** `src/app/dashboard-old-backup/` (old dashboard copy, unlinked),
  `src/app/test-components/` (dev playground), both still built and deployed.
- **Why it matters:** ships unused code to production; confuses the route map.
- **Plan:** confirm nothing references them, then delete in refactor phase
  (git history keeps the backup).
