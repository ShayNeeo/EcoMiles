/**
 * Unified Backend Helper
 *
 * Forwards requests to ECOMILES_API_URL (default http://127.0.0.1:8000) with
 * Authorization: Bearer DEMO, with automatic fallback to embedded honoEngine.
 */

import { honoApp } from './honoEngine';

export interface BackendOptions {
  method?: string;
  body?: unknown;
  headers?: Record<string, string>;
}

export async function callBackend<T = unknown>(path: string, options: BackendOptions = {}): Promise<T> {
  const method = (options.method || 'GET').toUpperCase();
  const upstreamBase =
    process.env.ECOMILES_API_URL ||
    (typeof process !== 'undefined' && process.env.GREENLOGIX_API_URL) ||
    'http://127.0.0.1:8000';

  const normalizedPath = path.startsWith('/api')
    ? path
    : `/api${path.startsWith('/') ? path : '/' + path}`;

  // 1. Attempt Upstream Forwarding
  try {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 1200);
    const targetUrl = `${upstreamBase.replace(/\/+$/, '')}${normalizedPath}`;

    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
      Authorization: 'Bearer DEMO',
      ...(options.headers || {}),
    };

    const res = await fetch(targetUrl, {
      method,
      headers,
      body: options.body ? JSON.stringify(options.body) : undefined,
      signal: controller.signal,
    });
    clearTimeout(timeout);

    if (res.ok) {
      return (await res.json()) as T;
    }
  } catch {
    // Upstream unreachable, fallback to embedded engine
  }

  // 2. Embedded Fallback via honoApp
  const simulatedReq = new Request(`http://localhost${normalizedPath}`, {
    method,
    headers: {
      'Content-Type': 'application/json',
      Authorization: 'Bearer DEMO',
      ...(options.headers || {}),
    },
    body: options.body ? JSON.stringify(options.body) : undefined,
  });

  const honoRes = await honoApp.fetch(simulatedReq);
  if (!honoRes.ok) {
    const errText = await honoRes.text();
    throw new Error(`Engine request failed (${honoRes.status}): ${errText}`);
  }

  return (await honoRes.json()) as T;
}
