# AGENTS.md

EcoMiles — pnpm monorepo for a Vietnam urban-logistics MVP (landing + dispatcher API + Flutter driver).

## Before any edit

1. Read [`rules/README.md`](rules/README.md).
2. Branch from **`dev`**, never from `stable` / `main`. See [`rules/branching.md`](rules/branching.md).
3. If more than one person or agent will touch files, copy [`rules/forms/CHANGE_REQUEST.md`](rules/forms/CHANGE_REQUEST.md) to `changes/CR-YYYYMMDD-NNN.md` and fill **MUST KEEP / MUST CHANGE / MUST NOT TOUCH** before coding. See [`rules/change-request.md`](rules/change-request.md).
4. One agent = one git worktree under `.worktrees/` = one `cr/<nnn>-<scope>` branch. See [`rules/agentic.md`](rules/agentic.md).

## Commands

```bash
pnpm install
pnpm run dev:landing
pnpm run build:landing
# API (when apps/api exists): cd apps/api && uv run pytest
# Driver: cd apps/mobile-driver && flutter test
```

Python: **`uv` only**. JS: **`pnpm`** / **`bun`**. Never `pip`, `npm install`, or `yarn`.

## Merge

| Flow | Gate |
|------|------|
| `feature` / `cr/*` → `dev` | CR + PR template `feature-to-dev` |
| `dev` → `stable` | QA form + PR template `promote-to-stable` |

Production deploys from **`stable`**.

## Layout

- `apps/landing` — marketing site (live)
- `apps/api` — FastAPI (Phase 1)
- `apps/mobile-driver` — Flutter (Phase 1)
- `apps/web-portal` — placeholder; do not invent a Next.js app unless a CR says so
- `docs/planning` — strategy, MVP, finance
- `docs/contests` — contest packets (SO 2026, RND 2026)
- `rules/` — this team's process (source of truth)
- `.planning/` — GSD plans; do not parallel-edit PLAN.md

## Ownership

Standing map: [`rules/ownership.md`](rules/ownership.md). CR table wins for that CR.
