// A tiny in-app mock server. Each handler file registers routes with `route()`;
// `mockTransport` matches the request, waits a realistic latency, and returns
// `{ status, body }` exactly like the real HTTP transport.
import type { HttpMethod, Transport, TransportRequest } from '@/api/client';
import type { ErrorCode } from '@/api/errors';
import { env } from '@/config/env';

import { restoreOnce, scheduleSave } from './persist';

export type MockContext = {
  params: Record<string, string>;
  query: TransportRequest['query'];
  body: any;
  headers: Record<string, string>;
};

type Handler = (ctx: MockContext) => unknown | Promise<unknown>;
type Route = { method: HttpMethod; regex: RegExp; keys: string[]; handler: Handler };

const routes: Route[] = [];

/** Register a mock endpoint. Path params use `:name`, e.g. `/services/:slug`. */
export function route(method: HttpMethod, path: string, handler: Handler) {
  const keys: string[] = [];
  const pattern = path.replace(/:(\w+)/g, (_, key: string) => {
    keys.push(key);
    return '([^/]+)';
  });
  const entry = { method, regex: new RegExp(`^${pattern}$`), keys, handler };
  // A handler file hot-reloaded in development registers its routes again: replace the old
  // handler instead of appending, or requests keep reaching the stale code (first match wins).
  const existing = routes.findIndex((r) => r.method === method && r.regex.source === entry.regex.source);
  if (existing >= 0) routes[existing] = entry;
  else routes.push(entry);
}

/** Throw from a handler to return an API error response. */
export class MockHttpError extends Error {
  constructor(
    readonly status: number,
    readonly code: ErrorCode,
    message?: string,
  ) {
    super(message ?? code);
  }
}

// Request log in development, silent under Jest.
const LOG = __DEV__ && process.env.NODE_ENV !== 'test';

const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));

/**
 * Copy through JSON like a real network round trip. Handlers return live db objects; handing those
 * to the app would let a later in-place edit change cached data behind React Query's back (same
 * reference → no re-render), e.g. a saved name not showing on Profile.
 */
const wire = <T>(v: T): T => (v === undefined ? v : JSON.parse(JSON.stringify(v)));

export const createMockTransport =
  (): Transport =>
  async ({ method, path, query, body, headers }) => {
    await Promise.all([sleep(env.mockLatencyMs), restoreOnce()]);
    // Every request may change state (polling GET /payments/{id} settles payments); saves are debounced.
    scheduleSave();
    for (const r of routes) {
      const match = r.method === method ? r.regex.exec(path) : null;
      if (!match) continue;
      const params = Object.fromEntries(r.keys.map((k, i) => [k, decodeURIComponent(match[i + 1])]));
      try {
        const result = await r.handler({ params, query, body: wire(body), headers });
        if (LOG) console.log(`[mock] ${method} ${path} → 200`);
        return { status: 200, body: wire(result ?? null) };
      } catch (e) {
        if (e instanceof MockHttpError) {
          if (LOG) console.log(`[mock] ${method} ${path} → ${e.status} ${e.code}`);
          return { status: e.status, body: { code: e.code, message: e.message } };
        }
        throw e;
      }
    }
    console.warn(`[mock] no handler for ${method} ${path}`);
    return { status: 404, body: { code: 'NOT_FOUND', message: `No mock for ${method} ${path}` } };
  };

/** Handlers call this to reject requests without a signed-in (non-guest) user. */
export function requireUser(ctx: MockContext) {
  const auth = ctx.headers.Authorization ?? '';
  if (!auth.startsWith('Bearer mock-access-')) throw new MockHttpError(401, 'UNAUTHORIZED');
  if (auth.includes('guest')) throw new MockHttpError(403, 'LOGIN_REQUIRED');
}
