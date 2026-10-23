# Ownership

One primary editor per path **during a CR**. GitHub CODEOWNERS (`.github/CODEOWNERS`) is the standing map; the CR table can override for that CR only.

## Standing map

| Path | Primary | Notes |
|------|---------|-------|
| `apps/api/**` | Chiến | FastAPI, solver, Jinja dispatcher |
| `apps/mobile-driver/**` | Thanh | Flutter |
| `apps/landing/**` | Thanh | Marketing site |
| `apps/web-portal/**` | Thanh | Placeholder until Phase 2 |
| `packages/shared-types/**` | Chiến | Contracts; freeze before Flutter consumes |
| `docs/planning/**` | Phúc + Khang | Finance / strategy; engineers don't rewrite numbers |
| `docs/contests/**` | Khang | Contest packet |
| `rules/**` `.github/**` `AGENTS.md` | Thanh | Process |
| `.planning/**` | whoever opened the GSD phase | Don't parallel-edit PLAN.md |

## Hotspots (serialize)

Never assign two worktrees to:

- `pnpm-lock.yaml` `pnpm-workspace.yaml` `package.json`
- `apps/api/openapi.json`
- `.github/workflows/**`
- `apps/api/data/emission_factors.json`

## CODEOWNERS GitHub handles

Repo owner: `@ShayNeeo`. Add teammates' GitHub usernames in `.github/CODEOWNERS` when they have access.
