import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import { honoApp, verifySessionToken } from '../src/server/honoEngine.ts';
import {
  getCompanySecurityPolicy,
  formatReceiverForTenantPolicy,
  buildCompany14DayTelemetry,
  encryptTenantPayloadAesGcm,
  decryptTenantPayloadAesGcm,
  type AuthenticatedSession,
  type CompanySecurityPolicy,
  type DailyTelemetryPoint,
} from '../src/utils/tenantPrivacyEngine.ts';

describe('Multi-Tenant B2B Authentication & Session Isolation (FB-05)', () => {
  it('authenticates NVC-COLD dispatcher with valid credentials', async () => {
    const res = await honoApp.request('/api/auth/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        username: 'orchestrator@nvc-cold.vn',
        password: 'NvcCold@2026!',
      }),
    });

    assert.equal(res.status, 200);
    const body = (await res.json()) as { ok: boolean; session: AuthenticatedSession };
    assert.equal(body.ok, true);
    assert.equal(body.session.tenant_id, 'TNT-NAMVIET-002');
    assert.equal(body.session.role, 'user');
    assert.equal(body.session.policy_id, 'STRICT-BYOK-COLDCHAIN');
    assert.match(body.session.token, /^ecm_v2\.[A-Za-z0-9_-]+\.[0-9a-f]{64}$/);

    const verified = await verifySessionToken(body.session.token);
    assert.ok(verified);
    assert.equal(verified?.tenant_id, 'TNT-NAMVIET-002');
  });

  it('authenticates BHX-HCM dispatcher with valid credentials', async () => {
    const res = await honoApp.request('/api/auth/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        username: 'dispatch@bhx-hcm.vn',
        password: 'BhxFmcg@2026!',
      }),
    });

    assert.equal(res.status, 200);
    const body = (await res.json()) as { ok: boolean; session: AuthenticatedSession };
    assert.equal(body.ok, true);
    assert.equal(body.session.tenant_id, 'TNT-BHX-001');
    assert.equal(body.session.role, 'user');
    assert.equal(body.session.policy_id, 'INTERNAL-STORE-NETWORK');
  });

  it('authenticates WCM-ERP dispatcher with valid credentials', async () => {
    const res = await honoApp.request('/api/auth/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        username: 'erp.ops@wcm-erp.vn',
        password: 'WcmZero@2026!',
      }),
    });

    assert.equal(res.status, 200);
    const body = (await res.json()) as { ok: boolean; session: AuthenticatedSession };
    assert.equal(body.ok, true);
    assert.equal(body.session.tenant_id, 'TNT-WINMART-003');
    assert.equal(body.session.role, 'user');
    assert.equal(body.session.policy_id, 'ZERO-PERSISTENCE-RAM-EPHEMERAL');
  });

  it('authenticates Driver account with bound vehicle and route metadata', async () => {
    const res = await honoApp.request('/api/auth/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        username: 'tx.hung@nvc-cold.vn',
        password: 'Driver51C@08',
      }),
    });

    assert.equal(res.status, 200);
    const body = (await res.json()) as { ok: boolean; session: AuthenticatedSession };
    assert.equal(body.ok, true);
    assert.equal(body.session.role, 'driver');
    assert.equal(body.session.tenant_id, 'TNT-NAMVIET-002');
    assert.equal(body.session.driver_route_idx, 0);
    assert.equal(body.session.driver_code, 'TX-NVC-01');
    assert.equal(body.session.assigned_plate, '51C-000.08');
  });

  it('authenticates Zero-Knowledge System Admin with blind policy', async () => {
    const res = await honoApp.request('/api/auth/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        username: 'sysadmin@ecomiles-ops.vn',
        password: 'EcoAdmin@ZK26!',
      }),
    });

    assert.equal(res.status, 200);
    const body = (await res.json()) as { ok: boolean; session: AuthenticatedSession };
    assert.equal(body.ok, true);
    assert.equal(body.session.role, 'admin');
    assert.equal(body.session.policy_id, 'ZERO-KNOWLEDGE-BLIND');
  });

  it('rejects invalid password with HTTP 401 and Vietnamese error message', async () => {
    const res = await honoApp.request('/api/auth/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        username: 'orchestrator@nvc-cold.vn',
        password: 'WrongPassword123!',
      }),
    });

    assert.equal(res.status, 401);
    const body = (await res.json()) as { ok: boolean; error: string };
    assert.equal(body.ok, false);
    assert.match(body.error, /Sai tên đăng nhập hoặc mật khẩu/);
  });

  it('returns current session via GET /api/auth/me for valid token', async () => {
    const loginRes = await honoApp.request('/api/auth/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        username: 'dispatch@bhx-hcm.vn',
        password: 'BhxFmcg@2026!',
      }),
    });
    const loginData = (await loginRes.json()) as { session: { token: string } };

    const meRes = await honoApp.request('/api/auth/me', {
      method: 'GET',
      headers: { Authorization: `Bearer ${loginData.session.token}` },
    });

    assert.equal(meRes.status, 200);
    const meData = (await meRes.json()) as { ok: boolean; session: AuthenticatedSession };
    assert.equal(meData.ok, true);
    assert.equal(meData.session.tenant_id, 'TNT-BHX-001');
  });

  it('revokes session on POST /api/auth/logout and blocks subsequent GET /api/auth/me', async () => {
    const loginRes = await honoApp.request('/api/auth/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        username: 'erp.ops@wcm-erp.vn',
        password: 'WcmZero@2026!',
      }),
    });
    const loginData = (await loginRes.json()) as { session: { token: string } };
    const token = loginData.session.token;

    // Logout
    const logoutRes = await honoApp.request('/api/auth/logout', {
      method: 'POST',
      headers: { Authorization: `Bearer ${token}` },
    });
    assert.equal(logoutRes.status, 200);
    const logoutData = (await logoutRes.json()) as { ok: boolean; revoked: boolean };
    assert.equal(logoutData.ok, true);
    assert.equal(logoutData.revoked, true);

    // Verify me is now rejected with 401
    const meRes = await honoApp.request('/api/auth/me', {
      method: 'GET',
      headers: { Authorization: `Bearer ${token}` },
    });
    assert.equal(meRes.status, 401);
    const meData = (await meRes.json()) as { ok: boolean; error: string };
    assert.equal(meData.ok, false);
    assert.match(meData.error, /Phiên đăng nhập đã hết hạn hoặc đã đăng xuất/);
  });
});

describe('Cross-Tenant Data Isolation Enforcement (FB-05)', () => {
  it('allows tenant to read their own summary', async () => {
    const loginRes = await honoApp.request('/api/auth/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        username: 'orchestrator@nvc-cold.vn',
        password: 'NvcCold@2026!',
      }),
    });
    const { session } = (await loginRes.json()) as { session: { token: string } };

    const summaryRes = await honoApp.request('/api/tenant/TNT-NAMVIET-002/summary', {
      method: 'GET',
      headers: { Authorization: `Bearer ${session.token}` },
    });

    assert.equal(summaryRes.status, 200);
    const data = (await summaryRes.json()) as {
      ok: boolean;
      policy: CompanySecurityPolicy;
      telemetry_14d: DailyTelemetryPoint[];
    };
    assert.equal(data.ok, true);
    assert.equal(data.policy.policy_id, 'STRICT-BYOK-COLDCHAIN');
    assert.equal(data.telemetry_14d.length, 14);
  });

  it('rejects cross-tenant read with HTTP 403 CROSS_TENANT_ACCESS_DENIED', async () => {
    // NVC user attempts to inspect BHX data
    const loginRes = await honoApp.request('/api/auth/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        username: 'orchestrator@nvc-cold.vn',
        password: 'NvcCold@2026!',
      }),
    });
    const { session } = (await loginRes.json()) as { session: { token: string } };

    const crossRes = await honoApp.request('/api/tenant/TNT-BHX-001/summary', {
      method: 'GET',
      headers: { Authorization: `Bearer ${session.token}` },
    });

    assert.equal(crossRes.status, 403);
    const crossData = (await crossRes.json()) as { ok: boolean; code: string; error: string };
    assert.equal(crossData.ok, false);
    assert.equal(crossData.code, 'CROSS_TENANT_ACCESS_DENIED');
    assert.match(crossData.error, /Truy cập bị từ chối/);
  });

  it('authenticates WinCommerce Driver (tx.nam@wcm-erp.vn), enforces WCM & SYS-ADMIN 403 isolation, and blocks tampered or case-mutated revoked tokens', async () => {
    // 1. WCM personal driver login (ACC-DRIVER-WCM-03)
    const wcmDrvRes = await honoApp.request('/api/auth/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        username: 'tx.nam@wcm-erp.vn',
        password: 'Driver51C@02',
      }),
    });
    assert.equal(wcmDrvRes.status, 200);
    const wcmDrvData = (await wcmDrvRes.json()) as { ok: boolean; session: AuthenticatedSession };
    assert.equal(wcmDrvData.session.role, 'driver');
    assert.equal(wcmDrvData.session.tenant_id, 'TNT-WINMART-003');
    assert.equal(wcmDrvData.session.assigned_plate, '51C-000.02');

    // Cookie-based authentication on /api/auth/me
    const cookieMeRes = await honoApp.request('/api/auth/me', {
      method: 'GET',
      headers: { Cookie: `ecm_session=${wcmDrvData.session.token}` },
    });
    assert.equal(cookieMeRes.status, 200);

    // 2. NVC dispatcher requesting WCM summary -> 403
    const nvcRes = await honoApp.request('/api/auth/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        username: 'orchestrator@nvc-cold.vn',
        password: 'NvcCold@2026!',
      }),
    });
    const { session: nvcSess } = (await nvcRes.json()) as { session: AuthenticatedSession };
    const crossWcm = await honoApp.request('/api/tenant/TNT-WINMART-003/summary', {
      method: 'GET',
      headers: { Authorization: `Bearer ${nvcSess.token}` },
    });
    assert.equal(crossWcm.status, 403);

    // 3. SYS-ADMIN requesting tenant summary -> 403
    const adminRes = await honoApp.request('/api/auth/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        username: 'sysadmin@ecomiles-ops.vn',
        password: 'EcoAdmin@ZK26!',
      }),
    });
    const { session: adminSess } = (await adminRes.json()) as { session: AuthenticatedSession };
    const adminCross = await honoApp.request('/api/tenant/TNT-NAMVIET-002/summary', {
      method: 'GET',
      headers: { Authorization: `Bearer ${adminSess.token}` },
    });
    assert.equal(adminCross.status, 403);

    // 4. Tampered HMAC signature -> null / 401
    const tamperedToken = `${nvcSess.token.slice(0, -2)}ff`;
    assert.equal(await verifySessionToken(tamperedToken), null);

    // 5. Logout revokes token AND uppercase hex-malleability attempt is strictly rejected (401)
    await honoApp.request('/api/auth/logout', {
      method: 'POST',
      headers: { Authorization: `Bearer ${nvcSess.token}` },
    });
    const [p0, p1, p2] = nvcSess.token.split('.');
    const upperMalleated = `${p0}.${p1}.${p2.toUpperCase()}`;
    const malleatedMe = await honoApp.request('/api/auth/me', {
      method: 'GET',
      headers: { Authorization: `Bearer ${upperMalleated}` },
    });
    assert.equal(malleatedMe.status, 401);
  });

  it('allows evaluator (role: tester) cross-tenant summary inspection for algorithmic auditing', async () => {
    const loginRes = await honoApp.request('/api/auth/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        username: 'evaluator@vsic-evsim.vn',
        password: 'EvsimAudit@2026',
      }),
    });
    const { session } = (await loginRes.json()) as { session: { token: string } };

    // Evaluator can audit BHX summary
    const auditRes = await honoApp.request('/api/tenant/TNT-BHX-001/summary', {
      method: 'GET',
      headers: { Authorization: `Bearer ${session.token}` },
    });
    assert.equal(auditRes.status, 200);
    const auditData = (await auditRes.json()) as { ok: boolean; policy: CompanySecurityPolicy };
    assert.equal(auditData.ok, true);
    assert.equal(auditData.policy.policy_id, 'INTERNAL-STORE-NETWORK');
  });
});

describe('Real WebCrypto AES-256-GCM Envelope Encryption & Decryption', () => {
  it('encrypts payload with tenant key and successfully decrypts with same tenant key', async () => {
    const payload = {
      order_id: 'COLD-2026-9901',
      receiver: 'Nhà Hàng Biển Đông Q1',
      phone: '0908123456',
      address: '24 Đường Thi Sách, Bến Nghé, Quận 1',
      temperature_c: -18,
    };

    const envelope = await encryptTenantPayloadAesGcm('TNT-NAMVIET-002', payload);
    assert.equal(envelope.tenant_id, 'TNT-NAMVIET-002');
    assert.equal(envelope.algorithm, 'AES-256-GCM');
    assert.ok(envelope.iv_hex.length === 24); // 12 bytes = 24 hex chars
    assert.ok(envelope.ciphertext_hex.length > 32); // Ciphertext + 16-byte tag

    const decrypted = await decryptTenantPayloadAesGcm('TNT-NAMVIET-002', envelope);
    assert.equal(decrypted.ok, true);
    if (decrypted.ok) {
      assert.deepEqual(decrypted.data, payload);
    }
  });

  it('fails WebCrypto decryption when another tenant attempts decryption (tag mismatch)', async () => {
    const payload = {
      secret_fmcg_pricing: '12500000_VND',
      store_code: 'BHX-STORE-084',
    };

    const envelope = await encryptTenantPayloadAesGcm('TNT-BHX-001', payload);

    // Nam Việt tries to decrypt BHX payload
    const failNvc = await decryptTenantPayloadAesGcm('TNT-NAMVIET-002', envelope);
    assert.equal(failNvc.ok, false);
    if (!failNvc.ok) {
      assert.match(failNvc.error, /WebCrypto AES-256-GCM authentication failed/);
    }

    // SysAdmin tries to decrypt BHX payload
    const failAdmin = await decryptTenantPayloadAesGcm('SYS-ADMIN', envelope);
    assert.equal(failAdmin.ok, false);
    if (!failAdmin.ok) {
      assert.match(failAdmin.error, /WebCrypto AES-256-GCM authentication failed/);
    }
  });

  it('isolates WinCommerce (TNT-WINMART-003) AES-256-GCM ciphertexts from other tenants', async () => {
    const wcmEnv = await encryptTenantPayloadAesGcm('TNT-WINMART-003', {
      erp_batch: 'WCM-500-ORD',
      customer_pseudo: 'KH-WCM-0001',
    });
    const okSelf = await decryptTenantPayloadAesGcm('TNT-WINMART-003', wcmEnv);
    assert.equal(okSelf.ok, true);
    const failBhx = await decryptTenantPayloadAesGcm('TNT-BHX-001', wcmEnv);
    assert.equal(failBhx.ok, false);
  });
});

describe('Company Security Policies & 14-Day Telemetry Differentiation', () => {
  it('configures distinct policy profiles across all 3 enterprises', () => {
    const nvc = getCompanySecurityPolicy('TNT-NAMVIET-002');
    const bhx = getCompanySecurityPolicy('TNT-BHX-001');
    const wcm = getCompanySecurityPolicy('TNT-WINMART-003');

    assert.equal(nvc.policy_id, 'STRICT-BYOK-COLDCHAIN');
    assert.equal(nvc.mask_phone_by_default, true);
    assert.equal(nvc.allow_dpo_unmask_with_audit, true);
    assert.equal(nvc.cold_chain_temp_sla_c, -18);

    assert.equal(bhx.policy_id, 'INTERNAL-STORE-NETWORK');
    assert.equal(bhx.mask_phone_by_default, false); // hotline visible
    assert.equal(bhx.strip_address_on_export, true);
    assert.equal(bhx.cold_chain_temp_sla_c, null);

    assert.equal(wcm.policy_id, 'ZERO-PERSISTENCE-RAM-EPHEMERAL');
    assert.equal(wcm.pseudonymize_customer_name, true);
    assert.equal(wcm.ephemeral_ram_only, true);
    assert.equal(wcm.cold_chain_temp_sla_c, 4);
  });

  it('formats receiver per company privacy policy', () => {
    const order = {
      row_num: 42,
      external_id: 'ORD-42',
      receiver: 'Nguyễn Văn A',
      phone: '0903123456',
      address: '150 Lê Thị Riêng, P. Bến Thành, Quận 1',
    };

    // WinCommerce: pseudonymized
    const wcmFmt = formatReceiverForTenantPolicy('TNT-WINMART-003', order, false);
    assert.equal(wcmFmt.display_receiver, 'KH-WCM-0042');
    assert.equal(wcmFmt.display_phone, '090****456');

    // NVC: masked by default, unmasked by DPO
    const nvcMasked = formatReceiverForTenantPolicy('TNT-NAMVIET-002', order, false);
    assert.equal(nvcMasked.display_phone, '090****456');
    const nvcUnmasked = formatReceiverForTenantPolicy('TNT-NAMVIET-002', order, true);
    assert.equal(nvcUnmasked.display_phone, '0903123456');

    // BHX: hotline unmasked for dispatcher
    const bhxFmt = formatReceiverForTenantPolicy('TNT-BHX-001', order, false);
    assert.equal(bhxFmt.display_phone, '0903123456');
  });

  it('generates distinct 14-day operational telemetry per company', () => {
    const tNvc = buildCompany14DayTelemetry('TNT-NAMVIET-002');
    const tBhx = buildCompany14DayTelemetry('TNT-BHX-001');
    const tWcm = buildCompany14DayTelemetry('TNT-WINMART-003');

    assert.equal(tNvc.length, 14);
    assert.equal(tBhx.length, 14);
    assert.equal(tWcm.length, 14);

    // Check volume orders difference
    assert.ok(tNvc[0].orders_completed > 100 && tNvc[0].orders_completed < 140);
    assert.ok(tBhx[0].orders_completed >= 70 && tBhx[0].orders_completed < 95);
    assert.ok(tWcm[0].orders_completed >= 450 && tWcm[0].orders_completed < 550);

    // Verify g CO2 per order calculation is present and realistic
    assert.ok(tNvc[0].g_co2_per_order > 300 && tNvc[0].g_co2_per_order < 600);
    assert.ok(tBhx[0].g_co2_per_order > 350 && tBhx[0].g_co2_per_order < 650);
  });
});
