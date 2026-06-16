# AGENTS.md — How to work with me in this repo

I (Haroon) am learning Next.js, React, and TypeScript by building this app.
AI assistance must speed up learning, never replace it. I should be able to
explain every line that lands in this repo.

## 1. Project context

- This worktree is on `learn/repo-audit`, branched from `main`.
- Purpose: audit and understand the codebase, log findings, then make small
  understood refactors that merge to `main` via PRs.
- The mushaf prototype lives in the sibling `Quranalysis/` worktree on
  `playground/mushaf-prototype` (reference only — never merge it wholesale).
- A future `feature/mushaf-*` branch will be created from `main` only after
  the audit/refactor is merged.

## 2. Interaction style

- Succinct answers. One point at a time. No long multi-section essays unless
  I ask for a deep dive.
- Answer my questions directly; don't quiz me unless I explicitly ask.
- When explaining code, cite the actual file/lines from this repo rather than
  generic examples.
- Challenge my architectural decisions and ask "why" — help me think
  critically; don't just agree or decide for me.

## 3. Code policy

- **Default: propose, don't write.** I approve all code before it lands, and
  it must follow the conventions already in this repo.
- AI may directly handle tedious work I already understand and approve:
  docs, configs, repetitive edits, test boilerplate, data scripts.
- AI must NOT write feature logic for me end-to-end.
- **Documentation lookups:** before suggesting APIs or library usage, check
  current docs via the available MCP tools (Context7 for libraries/frameworks,
  Supabase MCP/skill for anything Supabase) or official CLIs (`supabase`,
  `vercel`, `gh`). Never rely on training-data memory for fast-moving tools.
- Flag outdated or mismatched dependency usage when you see it.

## 4. Git, issues, and bug tracking

- Log every bug/finding in `docs/BUGS.md` (format defined at the top of that
  file). AI drafts the entry; I approve.
- **Commits:** AI drafts detailed commit messages summarizing what and why;
  I approve before committing. Never commit without asking.
- **GitHub issues:** for bugs/refactors worth tracking, AI drafts the issue
  (title, repro steps, suspected files, severity) using `gh`; I review and
  approve before it's created.
- Small PRs, one concern each. AI may draft PR descriptions for my approval.
- If asked to create github milestones to track multiple issues and sprint progress, organize it well using `gh` I review and approve before it's created.

## 5. Testing

- **I write the test plan first** — a plain-English list of behaviors to
  verify per feature. After I've thought through my cases, I may ask AI to
  review the list and suggest cases I missed (edge/failure cases).
- **AI writes the test code** from my approved plan — describe blocks,
  mocks, fixtures, boilerplate.
- **I review and run every test.** A test I can't explain doesn't get kept.
- AI must never weaken, skip, or delete a failing test to make it pass.
  Failing tests get investigated; findings go in `docs/BUGS.md`.
- Stack (when set up): Vitest for unit tests in `/tests` mirroring `src/`,
  Playwright for browser smoke flows.
