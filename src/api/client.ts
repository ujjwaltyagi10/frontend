// The one HTTP client. Screens never call fetch — they use feature hooks that call `api.*`
// endpoints, which call `request` here.
//
// Responsibilities: base URL, bearer token, Idempotency-Key, error mapping, and a single
// silent token refresh on 401 that parallel requests wait on (Frontend Spec → Rules).
import { env } from '@/config/env';
import { tokenStorage } from '@/lib/auth/token-storage';
import { getDeviceId } from '@/lib/device-id';

import { ApiError, toErrorCode } from './errors';
import type { AuthTokens } from './types';

export type HttpMethod = 'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE';

export type ApiRequest = {
  method: HttpMethod;
  path: string; // e.g. "/services/hourly" — relative to the /v1 base URL
  query?: Record<string, string | number | boolean | undefined>;
  body?: unknown;
  /** Required for money-moving writes; generate once per user action and reuse on retry. */
  idempotencyKey?: string;
  /** Set false for public endpoints that must not trigger the refresh flow. */
  auth?: boolean;
};

export type TransportRequest = ApiRequest & { headers: Record<string, string> };
export type TransportResponse = { status: number; body: unknown };
export type Transport = (req: TransportRequest) => Promise<TransportResponse>;

const fetchTransport: Transport = async ({ method, path, query, body, headers }) => {
  const url = new URL(env.apiUrl + path);
  Object.entries(query ?? {}).forEach(([k, v]) => v !== undefined && url.searchParams.set(k, String(v)));
  const res = await fetch(url.toString(), {
    method,
    headers: { 'Content-Type': 'application/json', ...headers },
    body: body === undefined ? undefined : JSON.stringify(body),
  });
  const text = await res.text();
  return { status: res.status, body: text ? JSON.parse(text) : null };
};

// Mocks are required lazily so production bundles can drop them when USE_MOCKS is false.
const transport: Transport = env.useMocks
  ? // eslint-disable-next-line @typescript-eslint/no-require-imports
    (require('@/mocks').mockTransport as Transport)
  : fetchTransport;

// ---- Auth failure hook ------------------------------------------------------
// The session store registers this so the API layer never imports app state.
let onAuthFailure: () => void = () => {};
export function setAuthFailureHandler(handler: () => void) {
  onAuthFailure = handler;
}

let refreshInFlight: Promise<boolean> | null = null;

async function refreshTokens(): Promise<boolean> {
  const current = await tokenStorage.get();
  if (!current) return false;
  try {
    const res = await transport({
      method: 'POST',
      path: '/auth/refresh',
      body: { refreshToken: current.refreshToken },
      headers: { 'X-Device-Id': await getDeviceId() },
    });
    if (res.status !== 200) return false;
    await tokenStorage.set(res.body as AuthTokens);
    return true;
  } catch {
    return false;
  }
}

async function send(req: ApiRequest): Promise<TransportResponse> {
  // X-Device-Id lets the backend bind sessions and rate-limit OTP per device.
  const headers: Record<string, string> = { 'X-Device-Id': await getDeviceId() };
  if (req.auth !== false) {
    const tokens = await tokenStorage.get();
    if (tokens) headers.Authorization = `Bearer ${tokens.accessToken}`;
  }
  if (req.idempotencyKey) headers['Idempotency-Key'] = req.idempotencyKey;
  try {
    return await transport({ ...req, headers });
  } catch (e) {
    throw new ApiError('NETWORK_ERROR', 0, e instanceof Error ? e.message : undefined);
  }
}

export async function request<T>(req: ApiRequest): Promise<T> {
  let res = await send(req);

  if (res.status === 401 && req.auth !== false) {
    refreshInFlight ??= refreshTokens().finally(() => {
      refreshInFlight = null;
    });
    if (await refreshInFlight) {
      res = await send(req);
    } else {
      onAuthFailure();
    }
  }

  if (res.status >= 200 && res.status < 300) return res.body as T;

  const err = (res.body ?? {}) as { code?: string; message?: string; details?: Record<string, unknown> };
  throw new ApiError(toErrorCode(err.code), res.status, err.message, err.details);
}
