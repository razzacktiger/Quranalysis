# Git Workflow

How code moves from my editor to `main`. AI drafts the tedious parts
(messages, issue/PR bodies); I approve everything before it happens.

## Branch model

| Branch | Purpose | Rule |
|--------|---------|------|
| `main` | Source of truth, deployed via Vercel or other deployment | Never commit/push directly |
| `playground/mushaf-prototype` | UX sketchbook (sibling worktree) | Never merged wholesale |
| `learn/repo-audit` | Current: audit docs + small understood refactors | PRs into `main` |
| `feature/*` | One feature each (e.g. mushaf), branched from `main` | PRs into `main` |
| `fix/*` | One bug or debt item each | PRs into `main` |

Naming for issue work: `fix/debt-003-useeffect-deps` — type, issue ref, short slug.

## Commit protocol

1. **Check before committing** (code changes only; docs-only commits skip):
   `npm run check` must pass (see `docs/TESTING.md`), plus a manual smoke
   check of whatever the change touched.
2. **Stage deliberately** — `git add` specific files, not `git add .`.
   Review the diff; never commit code I can't explain.
3. **Message** — AI drafts, I approve. Format (Conventional Commits):

   ```
   <type>: <imperative summary, ~60 chars>

   - what changed and WHY (not a line-by-line diff narration)
   - Refs #N / Fixes #N when an issue exists
   ```

   Types: `feat` (new behavior), `fix` (bug), `refactor` (no behavior
   change), `chore` (config/tooling), `docs`, `test`.
4. **One concern per commit.** Mechanical cleanups (e.g. DEBT-004 quote
   escaping) batch into their own commit, never mixed with logic changes.

## Push protocol

- Push only the current work branch: `git push -u origin <branch>`.
- Never push to `main`. Never force-push shared branches.
- Push when a coherent unit of work is done — not after every commit,
  but don't sit on days of unpushed work either (laptop = single point
  of failure).

## Pull request protocol

1. PR from work branch → `main`. Small, one concern, reviewable in minutes.
2. AI drafts title + description (summary, why, test evidence,
   `Closes #N`); I approve before creation via `gh pr create`.
3. `npm run check` must pass on the final commit.
4. I read the full diff on GitHub before merging — last chance to catch
   anything I don't understand.
5. Merge, delete the remote branch, `git pull` main into local worktrees
   that need it.

## Issue linkage

- Issues are repo-level, not branch-level. Connect them via branch name,
  `Refs/Fixes #N` in commits, and `Closes #N` in the PR.
- `Fixes`/`Closes` auto-close the issue when the PR merges to `main`.
- Track categories of debt in `docs/TECH-DEBT.md`; mirror as GitHub issues
  (label `tech-debt`) once actionable.

## Worktree reminders

- Each worktree = one branch; branches can't be checked out twice.
- Commits made in any worktree are visible to all (shared .git).
- Stashes are shared too — name them clearly (`git stash push -m "..."`).
