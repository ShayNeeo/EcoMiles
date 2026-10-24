# Managed Autonomous Loop Runbook: EcoMiles VSIC 3-Pillar Upgrade & Full-Site Humanizer

- **Command**: `/loop-start rfc-dag --mode safe`
- **Date**: 2026-10-24
- **Branch Strategy**: `dev` (integration) -> `stable` / `main` (production)
- **Hook Profile**: `ECC_HOOK_PROFILE=safe-default` (active)
- **Change Request**: `changes/CR-20261024-002.md`
- **Explicit Stop Condition**:
  1. All 4 VSIC Mentor & Co-Founder requirements (`Process Workflow Visualization`, `Enterprise Multi-Tenant Data Security & Access Approval`, `Automated Multi-Sheet XLSX/CSV/PDF Report Proof Studio`, and `Empty-Run / Chạy Xe Rỗng & Backhaul Optimization`) are implemented and verified.
  2. Zero em-dashes (`—`) and zero internal dev/agent jargon (`Act I..IV`, `Proxy`, `Ephemeral`, `GLX-HDT-v1`, `CR-...`) remain in user-facing copy across `apps/landing/src/**`.
  3. All deterministic gates pass (`pytest` 697+ tests, `ruff`, `tsrs` across 3 packages, `oxlint`, `impeccable detect` = `[]`, `astro build`).
  4. Independent Auditor, Security Reviewer, Vision QA across Investor/Dispatcher/Driver personas, and Judge (`confidence >= 0.90`) return `PASS`.

## Oh-My-Pi Multi-Agent Lineup
1. **Advisor / Planner**: Synthesizes Khánh Phương's VSIC requirements, spreadsheet links, and humanizer rules into `CR-20261024-002.md`.
2. **Executor / Workers**: Implement engine upgrades (`xlsxBenchmarkEngine.ts`), 4-Step Process & VSIC Dashboard (`BenchmarkAndStoryDeck.tsx`), Portal (`EcoMilesPortal.tsx`), and full-site humanizer (`apps/landing/src/components/**`, `src/pages/**`, `src/layouts/**`).
3. **Verifier / Auditor (`auditor`) & Security Reviewer (`security-reviewer`)**: Independently audit every changed file against `CR-20261024-002.md`.
4. **Vision QA & Judge (`browser` + `judge`)**: Navigate live URLs as Investor/Customer, Dispatcher, and Driver across Desktop (`1440x950`) and Mobile (`390x844`) viewports.

## Start & Monitor Commands
```bash
# 1. Pre-loop deterministic gate check
cd apps/api && rtk uv run --locked pytest -q && cd ../..
pnpm --filter @greenlogix/landing run typecheck && pnpm --filter @greenlogix/landing run lint

# 2. Check zero em-dash and zero dev-slop gate in user-facing copy
rg "—" apps/landing/src/
```
