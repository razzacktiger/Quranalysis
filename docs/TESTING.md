# Pre-commit checks

Run before every commit that touches code (docs-only commits can skip):

```bash
npm run check
```

This runs three steps, cheapest first, and stops at the first failure:

| Step | Command | What it catches |
|------|---------|-----------------|
| 1. Typecheck | `npm run typecheck` (`tsc --noEmit`) | Type errors anywhere in the project, even files you didn't open. `--noEmit` means "check only, don't output JS". |
| 2. Lint | `npm run lint` (`next lint`) | Unused vars, bad React patterns (e.g. wrong `useEffect` deps), style issues. |
| 3. Build | `npm run build` (`next build`) | Production-only errors: prerender failures, server/client boundary mistakes. Dev mode (`npm run dev`) is forgiving; the build is not. |

Then do a **manual smoke check**: run `npm run dev` and click through
whatever your change touched (e.g. login → dashboard → create session).

## Why this order

Fail fast: typecheck takes seconds, build takes a minute+. No point
building if the types are broken.

## Not yet set up (planned)

- **Vitest** — unit tests for pure functions/components, in `/tests`
  mirroring `src/`.
- **Playwright** — browser smoke tests for key flows (auth, session create).

Once added, the ladder becomes:
`typecheck → lint → vitest → build → playwright → commit`.
