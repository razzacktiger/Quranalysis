# Solo Workflow — Quranalysis (Web + Mobile)

**Owner:** Haroon (solo)
**Status:** Locked-in v1.0
**Last updated:** 2026-05-22
**Lives in:** `Quranalysis-Web/Quranalysis/docs/SOLO-WORKFLOW.md` (web repo)
**Referenced by:** Mobile repo's eventual `AGENTS.md` (when un-paused)

This is the agreed workflow, audit decisions, learning priorities, and shipping
checklist for moving Quranalysis from "agentic vibe-coding" to "fundamentals-first
solo development." It supersedes the `.claude/` v3 framework in the mobile repo.

The doc is opinionated on purpose. Where I (the workflow architect) recommended
something against a default reflex, the reasoning is included so future-Haroon
can argue with it instead of just following it.

---

## 1. Context & Decisions Snapshot

| Dimension                         | State as of 2026-05-22                                                                                                                                                                                                                              |
| --------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Validation                        | Informal only — friends/family looked at web; no hifz school or mosque cohort yet                                                                                                                                                                   |
| Time budget                       | ~15 hrs/week (10-20), sustained                                                                                                                                                                                                                     |
| Audience (validation target)      | Hifz school students/teachers, mosque community — **iOS-confirmed** for the cohort I'm pitching first                                                                                                                                               |
| Primary active project            | **Web** (`Quranalysis-Web/Quranalysis`) — Next.js 15.4.10, React 19.1, Tailwind v4, Supabase, `@google/genai`                                                                                                                                        |
| Mobile project                    | **Paused as the validation surface.** Mobile work resumes only AFTER web Mushaf demo validates. During TestFlight/App Store waits, web is the continuous testing/iteration ground.                                                                  |
| Mode                              | Web-first to validate via shared URL; mobile is the eventual delivery vehicle, not the validation vehicle                                                                                                                                           |
| Build strategy (web)              | **Option B — Selective rebuild.** Keep UI components, Tailwind config, routing skeleton. Rebuild auth, RLS, data fetching, AI call path from scratch in Epic 1. The audit (Epic 0) decides what to keep vs rebuild.                                 |
| Mushaf scope target               | Full feature set (tap-to-mark + drag-select range + historical overlay + colored highlights + persistence) as external demo target. Built via 3 internal milestones, demoed to one trusted user after each.                                         |
| Monetization                      | **Deferred until post-cohort retention.** No Stripe, no IAP, no subscription scaffolding until at least one cohort shows weekly returning use.                                                                                                      |
| Infrastructure                    | Vercel for web. AWS evaluation deferred — see §14 trigger criteria.                                                                                                                                                                                 |
| Handoff readiness                 | Triggered only after cohort retention OR monetization decision. Not before.                                                                                                                                                                         |

---

## 2. Two-Mode Workflow: Cursor + Claude Code

### Default mode: Cursor

If I'm unsure which tool to reach for, the answer is Cursor. Cursor is where
understanding happens — "explain this", "trace this", "what would break if I
removed this", "draft this with me, line by line."

### Switch to Claude Code only when ALL THREE are true

1. The task is already specified in a 2-3 sentence acceptance description I
   wrote (in a GitHub Issue or scratch note).
2. I can predict, before pressing run, roughly which files and how many lines
   change.
3. A wrong implementation is recoverable in under 5 minutes (git revert,
   re-run tests).

This collapses Claude Code to: mechanical refactors with a named pattern,
running tests, lint cleanup, commit message drafts, codemods, "rename X across
files."

### Hard rule

If I can't explain to myself *why* the change is correct before pressing run,
I'm in Cursor. Period.

### Anti — "understanding mode never ends" rules

These exist because the failure mode of fundamentals-first work is "study
forever, ship never." Three rules, enforced together:

1. **Time cap per learning topic: 3 hours.** When the cap is reached, I must
   start building something that uses the topic. If I don't have something to
   build, I'm not ready to learn the topic yet — go back to the codebase audit.
2. **One-pager output required.** Every learning session ends with a committed
   markdown file at `docs/learnings/<topic>.md`, max ~200 lines. No file,
   didn't happen.
3. **Ship-after-learn rule.** No two consecutive sessions can be pure-learning.
   Every learn-session is followed by a session that produces at least one
   commit using what was learned.

---

## 3. Task & Project Tracking via GitHub Issues

GitHub Issues is the single source of truth for tasks and bugs. No parallel
`TASKS.md`, no `tasks.json`, no `bugs.json`. The drift between the mobile
`state/project.json` (Expo SDK 54) and reality (Expo SDK 55) is the proof
that two sources of truth always disagree.

### Conventions

| Concept | GitHub mechanism |
|---|---|
| Epic | Milestone (e.g., `Epic 0 — Audit Week`, `Epic 1 — Selective Rebuild`) |
| Feature | Issue with label `feature` |
| Bug | Issue with label `bug` |
| Chore (deps, cleanup) | Issue with label `chore` |
| Learning topic | Issue with label `learning` |
| Area | Label: `auth`, `mushaf`, `dashboard`, `ai`, `infra`, `data` |
| Size | Label: `s`, `m`, `l`, `xl` |
| Status (optional) | GitHub Projects kanban board, columns: Backlog / Next / In Progress / Review / Done |

### Agent bridge

The `gh` CLI is how Cursor and Claude Code see the backlog. Both tools can run:

```
gh issue list --milestone "Epic 0 — Audit Week" --state open
gh issue view <number>
gh issue create --title "..." --body "..." --milestone "..." --label "feature,auth,m"
gh issue close <number>
```

`AGENTS.md` documents this so the agents know where work lives.

### What does NOT live in GitHub Issues

- The current understanding of "what this code does" — that lives in
  `docs/learnings/`.
- Long-form planning artifacts (specs, ADRs) — those become markdown in
  `docs/specs/` or `docs/decisions/`, with a tracking issue linking to them.
- This doc itself.

---

## 4. Slash Command Library (Cross-Tool)

### Setup

- Single source of truth: `docs/prompts/*.md` (one prompt per file).
- `.cursor/commands/` and `.claude/commands/` are **symlinks** to
  `docs/prompts/`:
  ```bash
  ln -s ../docs/prompts .cursor/commands
  ln -s ../docs/prompts .claude/commands
  ```
- Same prompt library, both tools. Zero dual maintenance.
- Fallback if symlinks misbehave: duplicate the files (it's 6 short markdowns).

### Minimum command set (write each as one prompt file)

| Command         | Purpose                                                                                                          |
| --------------- | ---------------------------------------------------------------------------------------------------------------- |
| `/audit-file`   | "Explain this file end-to-end. List assumptions. List things I should verify by reading other files."            |
| `/commit`       | "Look at staged diff. Run typecheck + lint. Draft a conventional-commit message. Show me before committing."     |
| `/epic`         | "From this brainstorm, draft an epic doc + 5-10 GH issue stubs. Output as one markdown for me to paste into gh." |
| `/feature`      | "From this idea, draft a feature spec with acceptance criteria + 3-5 implementation tasks."                      |
| `/bug`          | "Reproduce, isolate, draft the GH bug issue with steps, env, suspected files. Don't fix anything yet."           |
| `/learning`     | "I just learned X. Help me turn my notes into `docs/learnings/<topic>.md`, max 200 lines, with a code example."  |

### What is NOT in the command set (intentionally)

`/start-epic`, `/next-task`, `/complete-task`, `/end-session`,
`/agent-dispatch`, `/refactor-check`, `/improve-workflow`. These rebuild the
ceremony I'm retiring. Solo dev does not need start/end ceremony — `git
status` and a closed laptop are enough.

---

## 5. Harness Setup: `AGENTS.md` Pattern

Both repos use the same minimal structure:

```
<repo-root>/
  AGENTS.md                # canonical agent config (~150 lines max)
  CLAUDE.md                # one-line pointer: "See AGENTS.md."
  docs/
    SOLO-WORKFLOW.md       # this file (web repo only; mobile references it)
    prompts/               # slash commands (single source for both tools)
    standards/             # coding standards, conventions (per repo)
    learnings/             # one .md per topic; never indexed by JSON
    specs/                 # feature specs and design docs
    decisions/             # ADRs (optional, only if needed)
  .cursor/commands -> ../docs/prompts   # symlink
  .claude/commands -> ../docs/prompts   # symlink
```

### `AGENTS.md` sections (template, ~150 lines)

1. **What this project is** (3-5 lines)
2. **How to run** (`npm run dev`, `npm test`, env vars location)
3. **Where things live** (links to `docs/standards/`, `docs/learnings/`, this doc)
4. **Task tracking** ("Work is in GitHub Issues. Fetch with `gh issue list --milestone ...`")
5. **When to use Cursor vs Claude Code** (reference §2 above)
6. **Per-task acceptance checklist** (the three preconditions for CC, the
   ship-after-learn rule, what "done" means)
7. **Things to never do** (don't edit `.env`, don't run `npm install` without
   the security guardrails — link to `docs/standards/security.md`)

### What gets retired

- All JSON state files
- Slash command schemas (JSON Schema for commands)
- Multi-agent dispatch
- `core/lib/state-manager.ts`
- Anything that requires "starting a session" or "ending a session"

---

## 6. Mobile Repo: Parking Plan + `.claude/` Audit

The mobile repo (`Quranalysis-Mobile`) goes into hibernation until web Mushaf
validates with a real cohort. While paused: **no commits, no SDK upgrades, no
dependency churn, no Mushaf work.**

Exception: if a real CVE drops on a mobile dep (the security standard at
`Quranalysis-Mobile/.claude/project/standards/security.md` defines real CVE
discipline), apply the patch and that's it.

### Park-it commit on `epic-6-mushaf`

One commit that says "Parking mobile project until web Mushaf validates. See
web repo `docs/SOLO-WORKFLOW.md`." File a single GitHub Issue titled
`Mobile paused — resume when web Mushaf validates` and reference the trigger
criteria in §14.

### `.claude/` kill list (apply on or before the park-it commit)

| Path                                                    | Action                                                                       |
| ------------------------------------------------------- | ---------------------------------------------------------------------------- |
| `.claude/state/*.json`                                  | **Kill.** Source of drift; not load-bearing once the workflow changes.       |
| `.claude/core/agents/`                                  | **Kill.** Multi-agent dispatch isn't needed for one person.                  |
| `.claude/core/commands/schemas/`                        | **Kill.** Validates JSON state that no longer exists.                        |
| `.claude/core/lib/state-manager.ts`                     | **Kill.** Dies with the state files.                                         |
| `.claude/commands/agent-dispatch.md`                    | **Kill.**                                                                    |
| `.claude/commands/agent-complete.md`                    | **Kill.**                                                                    |
| `.claude/commands/start-epic.md`                        | **Kill.**                                                                    |
| `.claude/commands/next-task.md`                         | **Kill.**                                                                    |
| `.claude/commands/end-session.md`                       | **Kill.**                                                                    |
| `.claude/commands/complete-task.md`                     | **Kill.** Replaced by `/commit`.                                             |
| `.claude/commands/improve-workflow.md`                  | **Kill.**                                                                    |
| `.claude/commands/refactor-check.md`                    | **Kill.**                                                                    |
| `.claude/commands/research-tech.md`                     | **Keep, simplify** into `/learning`.                                         |
| `.claude/commands/spec-feature.md`                      | **Keep, simplify** into `/feature`.                                          |
| `.claude/commands/create-epic.md`                       | **Keep, simplify** into `/epic`.                                             |
| `.claude/commands/add-bug.md` + `fix-bug.md`            | **Keep, simplify** — collapse to `/bug` + actual fix happens in normal flow. |
| `.claude/workflow-audits/`                              | **Kill.** One-time docs that aren't re-read.                                 |
| `.claude/templates/`                                    | **Kill** if not actively used; otherwise inline into the relevant prompt.    |
| `.claude/meta/`                                         | **Kill.** Changelog can live in git history.                                 |
| `.claude/guides/workflows/`                             | **Kill.** Not load-bearing once the workflow changes.                        |
| `.claude/status/`                                       | **Kill.** Status is GitHub Issues + git status.                              |
| `.claude/project/standards/*.md`                        | **Keep, trim** to <300 lines each. Move to `docs/standards/` long-term.      |
| `.claude/project/learnings/`                            | **Keep**, flat folder, no `learnings-index.json`. Move to `docs/learnings/`. |
| `.claude/project/reference/TYPES.md` + ENUMS + API      | **Keep if accurate**; audit for drift before relying on any of them.         |
| `.claude/project/epics/active/EPIC-6-MUSHAF/`           | **Keep** (you'll come back to it post-validation).                           |
| `.claude/project/epics/archive/`                        | **Keep** (historical record).                                                |
| `.claude/project/specs/`                                | **Keep** (real planning artifacts).                                          |

Net: ~70-80% of `.claude/` retires when the mobile repo eventually un-pauses
with the new `AGENTS.md` pattern.

### Mobile un-pause criteria

See §14. Summary: web Mushaf demo lands with a real cohort AND at least one
cohort member asks for the mobile version.

---

## 7. Web Repo: Bootstrapping Steps

Concrete sequence to apply on the web repo (none of this happens until I
explicitly execute it; this section is the recipe, not the action).

1. **Retire stale planning artifacts.**
   - `TASK.md` (last updated Jan 2025, already drifted) → archive to
     `docs/archive/TASK-2025-01.md` for posterity, then delete from repo root.
   - `TESTING_PLAN.md` → audit relevance, keep or archive.
   - `temp_disable_rls_for_debugging.sql` → **delete** (this is dangerous to
     have in repo; Epic 0 will produce the correct RLS migration).
   - `table-restructure-only.sql` → audit relevance; if it represents the
     current schema, move to `docs/schema/current.sql`.
2. **Create the harness.**
   - Write `AGENTS.md` at repo root (~150 lines, template from §5).
   - Create `CLAUDE.md` containing one line: `See AGENTS.md.`
   - Create `docs/standards/`, `docs/learnings/`, `docs/prompts/`, `docs/specs/`.
   - Write the 6 prompts in `docs/prompts/`.
   - Create the two symlinks (`.cursor/commands`, `.claude/commands`).
3. **GitHub Issues setup.**
   - Create labels: `feature`, `bug`, `chore`, `learning`, `auth`, `mushaf`,
     `dashboard`, `ai`, `infra`, `data`, `s`, `m`, `l`, `xl`.
   - Create the milestones for Epic 0 through Epic 4 (Appendix A).
   - File 5 placeholder issues for Epic 0's five audit passes.
4. **First understanding-mode session.**
   - Open the first Epic 0 issue (RLS audit).
   - Work in Cursor.
   - End-of-session deliverable: section 1 of `docs/learnings/web-codebase-audit.md`
     + N new issues filed for what RLS audit surfaced.

---

## 8. Epic 0 — Audit Week (First Understanding-Mode Pass)

**Goal:** comprehension + a fixable backlog.
**Output:** one written audit doc (`docs/learnings/web-codebase-audit.md`) +
~15-30 GitHub Issues. **Not output:** code changes.

### The 5 audit passes (one per ~3-hour session = 1 work-week at 15 hrs)

1. **RLS audit.** Open the Supabase dashboard. List every table. Check RLS
   status per table. Read each policy line-by-line. The
   `temp_disable_rls_for_debugging.sql` file is the smoking gun that at least
   one table has RLS off. **Deliverable:** RLS state table in the audit doc +
   one issue per disabled-or-misconfigured policy. Do not fix anything yet.
2. **`better-sqlite3` verdict.** Grep every `import`/`require` of
   `better-sqlite3`. Determine: runtime path, build-time only, or dead? If
   it's runtime on Vercel, it's broken (serverless ephemeral filesystem).
   **Deliverable:** one-paragraph verdict + an issue with the disposition
   (Remove / Migrate to Postgres / Keep with documented purpose).
3. **Auth flow trace.** Pick one auth-required page. Trace end-to-end: where
   does the session cookie come from, what reads it, what happens on expiry,
   what happens on the OAuth callback. The absence of `@supabase/ssr` in the
   `package.json` means this is hand-rolled. **Deliverable:** a flow diagram
   (mermaid in the audit doc is fine) + issues for any broken/hacky steps.
4. **AI feature audit.** Find every Gemini call site. Identify: model name,
   prompt structure, error handling, what "issues last time" actually was
   (try to reproduce). **Deliverable:** AI feature summary + issues that
   become Epic 1's AI rebuild scope and Epic 5's full-rework scope.
5. **Dead code + dependency reality.** What `src/` files are reachable from
   the app router? What in `scripts/` is actually used? Any packages in
   `package.json` not imported anywhere? (Already known: `EditSessionModal.tsx`
   is 555 lines, over the project's 500-line rule — file the refactor issue.)
   **Deliverable:** a "candidates for removal" list + one tracking issue per
   removal candidate.

### Discipline rules for Epic 0

- **No code changes.** Filing the issue *is* the work. Resist "while I'm here
  let me just fix it."
- **Each pass produces one doc section + N issues.** No issues from a pass
  means I didn't look hard enough — redo the pass.
- **Time-box each pass to 3 hours.** When the box closes, capture "things I
  didn't get to" as a separate issue and stop.

### Why this is the right Epic 0

- Pure understanding-mode with a concrete shippable output (doc + issues).
- Produces the backlog that re-shapes every later epic in ways I can't
  predict from outside.
- De-risks the demo — RLS off + a shared URL = data breach.
- Builds the "audit a flow before changing it" muscle that solo production
  demands.

---

## 9. Epic 1 — Selective Rebuild: Load-Bearing Layers

**Strategy:** Option B. Rebuild the parts that matter for understanding;
keep the parts that don't teach anything new.

### Rebuild from scratch (using understanding-mode discipline)

| Layer                             | Rebuild approach                                                                                            |
| --------------------------------- | ----------------------------------------------------------------------------------------------------------- |
| Supabase schema + RLS             | Schema-first migration with RLS enabled by default. Every table has policies before any data is written.    |
| Auth                              | Use `@supabase/ssr` properly. Server-side session reads via middleware. Tested OAuth callback + refresh.    |
| Data fetching                     | Server Components for reads; Server Actions or Route Handlers for writes. No `fetch()` in client components |
|                                   | except where genuinely interactive.                                                                         |
| AI call path                      | Clean wrapper around `@google/genai` with current Gemini model. Typed inputs/outputs. Error handling that   |
|                                   | surfaces user-facing failures. Logging that records token usage.                                            |

### Keep as-is (re-read but don't rewrite)

| Layer                             | Why keep                                                                            |
| --------------------------------- | ----------------------------------------------------------------------------------- |
| UI components (`src/components/`) | Vibe-coded but functional. Re-reading them in Epic 0 builds enough understanding.   |
|                                   | Refactor only specific files Epic 0 flagged (e.g., `EditSessionModal.tsx` 555 lines).|
| Tailwind v4 config                | Working, minimal, no point rewriting.                                               |
| Routing skeleton (`src/app/`)     | App Router file tree stays. Internal route logic gets rebuilt as part of data layer.|
| Form/validation patterns          | Re-read; keep unless Epic 0 flagged real bugs.                                      |

### Why "rebuild auth/data/RLS but not UI"

The boring 60% of any app (CRUD forms, list views, dashboard tables) teaches
nothing on rewrite — it's just re-typing. The high-value understanding lives
in: auth + sessions + RLS, data flow (RSC vs Client), schema design, and AI
integration. Option B puts all rebuild hours on the layers that matter for
understanding. Option C (full rewrite) dilutes the same hours across busywork.

### Done condition for Epic 1

- Web app deploys to a Vercel preview URL with the rebuilt stack.
- All existing user-facing features still work (session CRUD, dashboard, AI
  chat).
- RLS is enabled and tested on every table.
- Auth flow has a written `docs/learnings/auth-flow.md` with the mermaid
  diagram from Epic 0 updated to reflect the rebuilt version.

### Time estimate

3-5 weeks at 15 hrs/week. The schedule slack is in "Arabic text rendering /
Supabase quirks" — both are known unknown-unknowns.

---

## 10. Learning Priorities (Web Stack, In Order)

**Approach:** "Learn what I touch, with the time cap and one-pager rules from
§2." Not a curriculum to grind through. Each topic gets touched when the
relevant epic touches it.

| #   | Topic                                                                | When it gets learned                             |
| --- | -------------------------------------------------------------------- | ------------------------------------------------ |
| 1   | Next.js App Router + RSC vs Client Components                        | Epic 1 (data fetching rebuild)                   |
| 2   | `@supabase/ssr` cookie/session model + middleware                    | Epic 1 (auth rebuild)                            |
| 3   | Supabase RLS — policies, roles, JWT claims on `sessions` / `session_portions` / `mistakes` | Epic 0 audit + Epic 1 rebuild                    |
| 4   | Server Actions vs Route Handlers — when to use which                 | Epic 1 (data layer rebuild)                      |
| 5   | Vercel deploy + env vars + preview URLs + how production differs     | Epic 1 (first deploy of rebuilt app)             |
| 6   | Tailwind v4 + responsive layout for mobile-Safari Arabic text        | Epic 2 (Mushaf milestone 1)                      |
| 7   | RTL + Naskh fonts + Arabic glyph measurement on the web              | Epic 2 (Mushaf milestone 1)                      |

### Topics explicitly NOT on this list (touch only when forced)

- Turbopack internals — works out of the box, dig only on breakage.
- Tailwind v4 internals beyond responsive layout.
- `@google/genai` streaming details — Epic 1 keeps the AI call path simple;
  streaming work happens in Epic 5.
- Mobile stack (NativeWind, Reanimated, Expo Router, Maestro, expo-sqlite,
  expo-speech-recognition) — paused with the mobile repo.

### Time investment

At 3 hrs/topic + one-pager, 7 topics = ~21 hrs of pure learning time spread
across ~12 weeks. That's <12% of the total time budget. The rest is shipping.

---

## 11. Mushaf-on-Web MVP Scope (Epic 2)

**External demo target (what the hifz teacher sees):** full Mushaf with
tap-to-mark + drag-select range + historical overlay + colored highlights +
persistence + mobile-responsive layout.

**Build path: 3 internal milestones with a 1-person demo after each.**

### Milestone 1 — Viewer + tap-to-mark + colored highlights + persist

- Quran page viewer with correct RTL + naskh rendering.
- Tap a word → mark mistake (category + optional note).
- Colored highlight per mistake category, persisted to Supabase.
- Mobile-responsive (works on iPhone Safari).
- **Demo target:** one person who recites (friend or family member).
- **Why first:** validates that the Arabic rendering is actually correct
  before any gesture work. If the text is wrong, everything downstream is
  wasted.

### Milestone 2 — Drag-select for practice range

- Drag across words to set the session's practice range (e.g., ayah X to Y).
- Practice range can alternatively be set via a plain form on the previous
  screen — the drag gesture is a UX enhancement, not a dependency.
- **Demo target:** same person, validates that range selection feels right
  on touch.

### Milestone 3 — Historical mistakes overlay

- Toggle to show past mistakes on the current page (color-coded by recency).
- Performance check: long surah, many mistakes, no jank on mobile Safari.
- **Demo target:** the actual hifz teacher pitch happens after this lands.

### Hidden costs to plan for

- Ayah numerals (Arabic-Indic digits vs Latin).
- Word-boundary tap targets in RTL flexbox.
- Pinch-zoom behavior on mobile Safari.
- Glyph alignment when font fallbacks kick in.
- Historical overlay performance on a long surah.

### Time estimate

3-5 weeks total. Weeks 2-3 are the painful "Arabic text measurement / glyph
alignment" weeks every web developer underestimates. Slip past 5 weeks → stop
and re-scope (cut milestone 3 or simplify milestone 2).

---

## 12. Web Shipping Checklist (Validation Pilot, NOT Full Launch)

For a shared-URL pilot with a hifz school cohort. Intentionally short.

### Must-have before sharing the URL externally

- [ ] **RLS enabled and verified on every Supabase table.** (Epic 0 + 1 output.)
- [ ] **Auth working on real devices, not just localhost.** (Epic 1 output.)
- [ ] **Sentry (or equivalent) wired for client + server errors.** Free tier
      is fine. Wire before invites go out.
- [ ] **Privacy policy at a stable URL.** Plain markdown deployed to
      `/privacy` is acceptable for cohort pilot. (Required again for App Store later.)
- [ ] **Feedback channel** — even an email alias forwarding to my inbox,
      printed inside the app on a "Help" page.
- [ ] **Mobile-responsive baseline** — every page works on iPhone Safari
      without horizontal scroll.
- [ ] **Onboarding doc for cohort** — a one-page "what to test, what to
      ignore, how to report bugs" sent with the URL.
- [ ] **Vercel production environment variables verified.** No
      `NEXT_PUBLIC_*` containing secrets.
- [ ] **One end-to-end happy-path manual test** before each external share:
      sign in → log a session → mark a Mushaf mistake → sign out → sign in
      again → see the mistake.

### Explicitly deferred until post-validation

- Full App Store metadata + screenshot set (mobile is paused).
- IAP / Stripe / any monetization scaffolding.
- Terms of Service (privacy policy alone is enough for cohort pilot; ToS
  becomes mandatory at monetization).
- Analytics dashboards beyond crash + a handful of named events.
- Localization beyond English + Arabic snippets.
- Web marketing site.
- On-call rotation (I am on-call; no rotation needed).

---

## 13. Handoff-Readiness Definition

Trigger to start thinking about this: cohort pilot shows retention OR a
monetization decision has been made. Not before.

When ready to bring on a developer, the repo needs:

- `README.md` that gets a new dev running on their laptop in <30 minutes.
- `ARCHITECTURE.md` — single file, ~500-800 lines — data flow, auth flow,
  navigation graph, what's intentional vs accidental, where each layer lives.
- GitHub Issues reflecting reality (no stale tickets older than 60 days).
- One end-to-end happy-path walkthrough with file pointers: "user opens app →
  signs in → logs a session → marks a Mushaf mistake."
- A hand-curated `KNOWN-ISSUES.md` (~50 items max, not auto-generated).
- `.env.example` complete and accurate.
- The `docs/learnings/*.md` written during understanding-mode become the new
  dev's onboarding curriculum.

What this list is NOT: every standards file I keep today. Handoff needs the
architecture story, not the rules-of-the-road.

---

## 14. Deferred Decisions With Trigger Criteria

These are real decisions I've put off, with explicit conditions that would
make me revisit. Writing them down so I don't drift into them.

| Decision                                  | Deferred until                                                                                                                                                                                                  |
| ----------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Move off Vercel to AWS                    | Vercel monthly bill >$50 sustained, OR Vercel doesn't support a service I need (long-running websocket, GPU, region not available), OR a paying customer requires it for compliance.                            |
| Resume mobile project                     | Web Mushaf demo lands with a real cohort AND at least one cohort member asks for the mobile version, OR cohort retention is established and I'm choosing to expand to a second platform.                        |
| Stripe / IAP / monetization               | One cohort shows weekly returning use for at least 4 weeks. Until then, no payment scaffolding.                                                                                                                 |
| Vercel AI SDK + AI Gateway migration      | Epic 5 (post-cohort full AI rework). Until then, Epic 1's clean wrapper around `@google/genai` is enough.                                                                                                       |
| Firebase removal from mobile              | When mobile un-pauses. First task: audit what Firebase is actually being used for. Likely outcome: remove `@react-native-firebase/app` because nothing uses Firebase features; use Sentry for crash reporting.   |
| `react-native-paper` vs NativeWind        | When mobile un-pauses. Decide which styling system stays; demote the other to "only where strictly needed."                                                                                                     |
| Test framework (web)                      | When Epic 1's rebuild stabilizes. Likely choice: Playwright for E2E. Until then, manual happy-path tests before each share.                                                                                     |

---

## 15. Monthly Workflow Review

A 30-minute self-check, last day of the month. Four questions:

1. **Am I shipping?** Count merged PRs / closed issues in the past 30 days.
   If it's < 4, the bottleneck is workflow, not knowledge. Investigate.
2. **Am I learning?** Count `docs/learnings/*.md` files added or substantially
   edited in the past 30 days. If it's 0 across two consecutive months,
   I've reverted to vibe-coding without noticing.
3. **Am I drifting?** Is there a known unknown I've been avoiding? (E.g.,
   "I don't know if RLS is actually on", "I don't know what the AI feature
   actually costs.") Surface it; file an issue.
4. **Is the scope honest?** Are any of the deferred decisions in §14 silently
   getting picked up? If yes, either officially un-defer (and update this
   doc) or genuinely stop.

If two of four answers are "no", I stop new feature work and spend the next
session on whichever question failed worst.

---

## 16. Open Risks Not Closed

Honest list of risks the plan does not fully address. Writing them down so
they're visible.

- **The web codebase audit (Epic 0) may reveal worse than I expect.** If
  the auth flow is fundamentally broken or the schema is unworkable, Epic 1
  expands. I should not lie to myself about scope creep here; if Epic 1
  doubles, the cohort pilot slips.
- **Mushaf-on-web has unknown unknowns around Arabic text rendering.**
  Browser text APIs are not designed for ayah-by-ayah measurement. I may
  hit a wall that forces a server-side rendering approach (canvas, SVG, or
  pre-rendered images like the mobile app's CDN approach).
- **Mobile context-switch temptation is real.** Every time I see a Reanimated
  release I'll want to "just check." The park-it commit and the §14 trigger
  criteria are the discipline. If I find myself opening the mobile repo
  more than once a month, that's a flag.
- **"iOS-confirmed" was based on one school.** If pitch #2 is at a different
  community, verify their platform mix before assuming.
- **Firebase mystery in mobile is still unresolved** — parked alongside the
  mobile project. Will become the first audit task when mobile un-pauses.
- **I am the single point of failure for everything** — code, ops, design,
  support, on-call. The 15 hrs/week budget assumes good health. If I get
  sick or burnt out for 2 weeks, the cohort pilot slips and there is no
  fallback.
- **"Eventually monetize" is not a plan.** Until §14's monetization trigger
  fires, I have no opinion about whether monetization should happen at all.
  Cohort retention may not happen; that's an outcome to face honestly.

---

## Appendix A — Proposed Initial Epic Backlog (Draft)

Order is the recommended sequence. Time estimates assume 15 hrs/week with
the discipline rules in §2 enforced. Each epic becomes a GitHub Milestone.

| #   | Epic                                                | Goal                                                                       | Realistic time |
| --- | --------------------------------------------------- | -------------------------------------------------------------------------- | -------------- |
| 0   | Audit Week                                          | 5 audit passes; doc + ~15-30 issues filed                                  | 1 week         |
| 1   | Selective Rebuild: Auth + RLS + Data + AI call path | Rebuild load-bearing layers; keep UI. Deploy to Vercel preview.            | 3-5 weeks      |
| 2   | Mushaf on Web                                       | Full external scope via 3 internal milestones (M1, M2, M3) with 1p demos.  | 3-5 weeks      |
| 3   | Cohort Pilot Readiness                              | Sentry, privacy policy, feedback, responsive baseline, onboarding doc.     | 1 week         |
| 4   | Cohort Pilot                                        | Share URL with hifz school / mosque. Collect feedback. Triage.             | open-ended     |
| 5   | AI Feature Full Rework                              | Model strategy, prompts, telemetry, AI SDK eval (post-cohort feedback).    | 2-3 weeks      |
| —   | Future, un-prioritized                              | Monetization, mobile resumption, AWS evaluation. Gated by §14 criteria.    | —              |

**Realistic total to cohort pilot:** 8-12 weeks.

The "realistic" column assumes my time estimates are right, which they
historically are not. Add 30% slack mentally. If I'm beyond Epic 2 by
week 10, scope-cut Mushaf to milestone 2.

---

## Changelog

| Version | Date       | Change                                                                                                                |
| ------- | ---------- | --------------------------------------------------------------------------------------------------------------------- |
| 1.0     | 2026-05-22 | Initial lock-in. Web-first validation strategy, Option B selective rebuild, Cursor-default + narrow Claude Code use.  |
