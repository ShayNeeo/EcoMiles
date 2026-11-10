# Zalo Feedback Remediation & Multi-Tenant Auth/Privacy Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Resolve all 5 Zalo team/user feedback items on the `dev` branch and `dev` Cloudflare preview deployment by shipping an Editorial Daylight public landing page & B2B SaaS pricing matrix, multi-day dashboard operational/carbon telemetry, a dedicated personal driver account cockpit, and real HMAC-signed multi-company login/logout with prefilled credentials and distinct per-company WebCrypto AES-256-GCM & NĐ 13/2023 privacy policies.

**Architecture:** Three cleanly fenced slices in `apps/landing`: (1) Auth, Tenant Isolation & WebCrypto Privacy Engine (`tenantPrivacyEngine.ts` + `honoEngine.ts` + deterministic Node tests); (2) Authenticated Multi-Tenant Workspace, Rich 14-Day Telemetry & Personal Driver Cockpit (`EcoMilesPortal.tsx`); and (3) Editorial Daylight Marketing & B2B SaaS Pricing Surface (`App.tsx` + `src/components/*.tsx` + `index.css`).

**Tech Stack:** Astro 5 SSR (`@astrojs/cloudflare`), React 19, TypeScript, Hono Edge API, WebCrypto API (`crypto.subtle` PBKDF2 + AES-256-GCM + HMAC-SHA256), Tailwind CSS, ECharts.

**Spec:** `changes/CR-20261111-001.md` and `/home/shayneeo/Documents/SecondBrain/Inbox/EcoMiles Zalo Feedback & Auth-UX Upgrade Plan (2026-11-11).md`

## Global Constraints

- Target git branch: `dev` ONLY (`main` and `stable` MUST NOT BE MODIFIED).
- Target Cloudflare deployment: `--project-name=ecomiles --branch=dev` ONLY (`https://dev.ecomiles.pages.dev`).
- Preserve all locked Pitch Deck benchmark figures (`374.4 km -> 243.7 km`, `-34.9%`, `6.5 km / 2.7%` empty, `28 -> 0` QĐ 23 violations, `56.66 kg CO₂e`).
- Obey `craft-floor.md`: ≥4.5:1 text contrast, zero eyebrow kickers above headings, zero gradient text, zero em-dashes (`—`) in user-facing Vietnamese JSX copy, zero manual device pickers.

## Review Focus

1. Wrong password submission on `/dashboard` login form -> must return `HTTP 401` from `POST /api/auth/login` and keep the workspace locked with a clear Vietnamese error message.
2. Cross-tenant API access -> calling `GET /api/tenant/TNT-BHX-001/summary` with a token issued to `TNT-NAMVIET-002` must return `HTTP 403` (`CROSS_TENANT_ACCESS_DENIED`).
3. Token reuse after Logout -> calling `GET /api/auth/me` with a token passed to `POST /api/auth/logout` must return `HTTP 401` (`SESSION_REVOKED`).
4. Cross-tenant / Admin ciphertext decryption -> calling `decryptTenantPayload` on a `TNT-NAMVIET-002` AES-256-GCM ciphertext using `TNT-BHX-001` or Admin key material must throw/return `auth_tag_mismatch` (`decrypted: null`).
5. Personal Driver scope -> logging in as `tx.hung@nvc-cold.vn` must lock `/driver` to assigned vehicle index `0` without exposing other vehicles' routes, company-wide revenue, or an unauthenticated company switcher.

---

### Task 1: Multi-Tenant Auth, Session Revocation & Per-Company WebCrypto Privacy Engine

**Files:**
- Modify: `apps/landing/src/utils/tenantPrivacyEngine.ts`
- Modify: `apps/landing/src/server/honoEngine.ts`
- Create: `apps/landing/tests/auth_tenant_privacy.test.ts`

**Interfaces:**
- Produces in `tenantPrivacyEngine.ts`:
  - `CompanySecurityPolicy` (`policy_id`, `tier_label`, `mask_phone_by_default`, `pseudonymize_customer_name`, `allow_dpo_unmask_with_audit`, `ephemeral_ram_only`, `strip_address_on_export`, `invoice_bank_name`, `invoice_account_masked`, `scope3_shipper_standard`)
  - `DemoCredentialAccount` (`account_id`, `label`, `role: AppRole`, `tenant_id: string`, `username: string`, `password: string`, `driver_route_idx?: number`, `badge: string`)
  - `DEMO_CREDENTIAL_ACCOUNTS: DemoCredentialAccount[]`
  - `encryptTenantPayloadAesGcm(tenantId: string, plaintextObj: Record<string, unknown>): Promise<{ ivHex: string; ciphertextHex: string; keyFingerprint: string }>`
  - `decryptTenantPayloadAesGcm(callerTenantId: string, envelope: { ivHex: string; ciphertextHex: string }): Promise<{ ok: true; data: Record<string, unknown> } | { ok: false; error: string }>`
  - `buildCompany14DayTelemetry(tenant: CompanyTenant): Array<{ date: string; orders: number; km_saved: number; fuel_saved_vnd: number; g_co2_per_order: number; sla_pct: number }>`
- Produces in `honoEngine.ts`:
  - `POST /api/auth/login` (`{ username, password }` -> `200 { ok: true, token, session: { account_id, username, role, tenant_id, driver_route_idx, issued_at, expires_at, key_fingerprint, policy_id } }` or `401 { ok: false, error }`)
  - `POST /api/auth/logout` (`Authorization: Bearer <token>` -> revokes token, clears cookie, returns `200 { ok: true, revoked: true }`)
  - `GET /api/auth/me` (`Authorization: Bearer <token>` -> `200` active session or `401`)
  - `GET /api/tenant/:tenantId/summary` (`Authorization: Bearer <token>` -> `200` tenant telemetry if `session.tenant_id === tenantId`, else `403`)

- [ ] **Step 1: Write failing unit & security tests in `apps/landing/tests/auth_tenant_privacy.test.ts`** covering valid login (`200`), wrong password (`401`), cross-tenant access (`403`), logout token revocation (`401`), driver single-truck claim, and WebCrypto AES-256-GCM cross-tenant decryption rejection.
- [ ] **Step 2: Implement `DEMO_CREDENTIAL_ACCOUNTS`, `CompanySecurityPolicy`, WebCrypto `AES-256-GCM`, and `buildCompany14DayTelemetry` in `tenantPrivacyEngine.ts`, plus HMAC-SHA256 `/api/auth/*` and `/api/tenant/:tenantId/summary` in `honoEngine.ts`.**
- [ ] **Step 3: Run `node --experimental-strip-types --test apps/landing/tests/auth_tenant_privacy.test.ts` and verify 100% PASS.**

---

### Task 2: Authenticated Multi-Company Portal, 14-Day Carbon/ROI Dashboard & Personal Driver Cockpit

**Files:**
- Modify: `apps/landing/src/islands/EcoMilesPortal.tsx`

**Interfaces:**
- Consumes from Task 1: `DEMO_CREDENTIAL_ACCOUNTS`, `B2B_COMPANIES`, `encryptTenantPayloadAesGcm`, `decryptTenantPayloadAesGcm`, `buildCompany14DayTelemetry`, and `/api/auth/login`, `/api/auth/logout`, `/api/auth/me`, `/api/tenant/:tenantId/summary`.

- [ ] **Step 1: Upgrade Sign-In Gate & Session Lifecycle in `EcoMilesPortal.tsx`**:
  - Real `<form>` with prefilled `username` and `password` inputs, show/hide password toggle, and 1-click Demo Account preset pills (`Chuỗi Lạnh Nam Việt`, `Bách Hóa Xanh`, `WinCommerce`, `Tài xế Nguyễn Văn Hùng`, `EVSIM Evaluator`, `Zero-Knowledge Admin`).
  - Remove the unauthenticated header company `<select>` switcher for `user` and `driver` roles; display locked company badge + active security tier pill + real **`Đăng xuất`** button (`POST /api/auth/logout` + memory/storage wipe).
- [ ] **Step 2: Enrich `/dashboard` (`userTab === 'overview'` & `'privacy_security'`)**:
  - Add 14-Day Company Operational & Fuel Savings EChart, Rebound-Effect Emission Intensity (`g CO₂e/đơn` vs. Absolute `kg CO₂e`), 3-Scenario Carbon Value Toggle (`NĐ 119/2025`, `Tự nguyện FDI`, `EU CBAM`), Corporate Bank / VAT E-Invoice card, and live company-specific privacy behavior (`NVC-COLD` audit-logged DPO temporary unmasking vs. `WCM-ERP` RAM-ephemeral pseudonymized `KH-WCM-****` vs. Admin live WebCrypto AES-GCM decryption failure proof).
- [ ] **Step 3: Isolate `/driver` (`activeRole === 'driver'`)**:
  - Personal Driver Account header (`Mã tài xế`, assigned plate, shift status), Luật TTATGT 2024 `<=4h00` continuous driving progress bar, stop-by-stop truck payload mass (`kg`) EChart (outbound drop-off + backhaul pickup), personal navigation preference toggle, and masked proxy call actions.

---

### Task 3: Editorial Daylight Landing Page & B2B SaaS Pricing Redesign

**Files:**
- Modify: `apps/landing/src/index.css`
- Modify: `apps/landing/src/App.tsx`
- Modify: `apps/landing/src/components/Navbar.tsx`
- Modify: `apps/landing/src/components/Hero.tsx`
- Modify: `apps/landing/src/components/Solutions.tsx`
- Modify: `apps/landing/src/components/InteractiveSavingsCalculator.tsx`
- Modify: `apps/landing/src/components/WorkflowShowcase.tsx`
- Modify: `apps/landing/src/components/DriverAndDispatcherShowcase.tsx`
- Modify: `apps/landing/src/components/PricingAndPilot.tsx`
- Modify: `apps/landing/src/components/Team.tsx`
- Modify: `apps/landing/src/components/Footer.tsx`
- Modify: `apps/landing/src/components/PilotModal.tsx`
- Modify: `apps/landing/src/components/RolePortalModal.tsx`

- [ ] **Step 1: Establish Editorial Daylight tokens in `index.css` & `App.tsx`** (`#F8FAFC` / `#FFFFFF` warm alabaster & crisp paper ground, `#0F172A` slate-ink, `#14532D` forest-emerald, `#16A34A` action green, custom selection, focus rings, scrollbars, `tabular-nums`).
- [ ] **Step 2: Distill `Navbar.tsx` & `Hero.tsx`** (bright daylight header, concise 2-line Hero title + 1-sentence plain-Vietnamese subtitle + `Đăng nhập Hệ thống` & `Đối chứng 2 Bản đồ` CTAs + large crisp visual showcase of the live HCMC route map & dashboard).
- [ ] **Step 3: Redesign `PricingAndPilot.tsx` & remaining landing sections (`Solutions`, `WorkflowShowcase`, `DriverAndDispatcherShowcase`, `InteractiveSavingsCalculator`, `Team`, `Footer`, `PilotModal`, `RolePortalModal`)** into a cohesive, visual-first Editorial Daylight B2B SaaS experience (structured SaaS pricing matrix + Corporate Bank / VAT E-Invoice settlement strip, concise scannable copy, zero dark gym-card blocks, zero eyebrow kickers).
- [ ] **Step 4: Run `typecheck`, `oxlint`, `astro build`, `impeccable detect --json`, headless Chromium Desktop + Mobile Vision QA, independent `auditor` + `reviewer` gates, push `dev`, and deploy `--branch=dev` to Cloudflare Pages.**
