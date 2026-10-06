// Mock /me (H1–H3, H10). Same rules as the Go backend: trimmed names ≤ 50, lower-cased email,
// "" clears a field, phone read-only; deletion needs the OTP and no open bookings.
import { db } from '../db';
import { MockHttpError, requireUser, route, type MockContext } from '../router';
import { deletedPhones, MOCK_OTP, pendingDeletion, phoneFromToken } from './auth';
import { activePass, walletTotal } from './wallet';
import { addresses } from '../fixtures/geo';

const OPEN = ['pending_payment', 'confirmed', 'assigned', 'in_progress'];

/**
 * The signed-in mock user. After an app reload the in-memory db is empty but the app still holds
 * its token: rebuild the user from the phone in the token. A token without one (issued before
 * tokens carried it) can't be recovered, so answer like a real server would for a vanished
 * account — 401 — and the app logs out cleanly.
 */
export function me(ctx: MockContext) {
  // Scheduled for deletion: logged out until the user logs in again (which cancels it).
  const tokenPhone = phoneFromToken(ctx.headers.Authorization);
  if (tokenPhone && pendingDeletion.has(tokenPhone)) throw new MockHttpError(401, 'UNAUTHORIZED');
  if (!db.me) {
    const phone = phoneFromToken(ctx.headers.Authorization);
    if (!phone || deletedPhones.has(phone)) throw new MockHttpError(401, 'UNAUTHORIZED');
    db.me = { id: `u_${phone}`, phone, firstName: null, lastName: null, email: null, whatsappOptIn: false };
  }
  return db.me;
}

route('GET', '/me', (ctx) => {
  requireUser(ctx);
  return me(ctx);
});

route('PATCH', '/me', (ctx) => {
  requireUser(ctx);
  const cur = me(ctx);
  const b = ctx.body ?? {};
  const clean = (v: unknown) => (typeof v === 'string' ? v.trim() : undefined);
  const first = clean(b.firstName);
  const last = clean(b.lastName);
  const email = clean(b.email)?.toLowerCase();
  if ((first?.length ?? 0) > 50 || (last?.length ?? 0) > 50)
    throw new MockHttpError(422, 'VALIDATION_FAILED');
  if (email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) throw new MockHttpError(422, 'VALIDATION_FAILED');
  if (first !== undefined) cur.firstName = first || null;
  if (last !== undefined) cur.lastName = last || null;
  if (email !== undefined) cur.email = email || null;
  return cur;
});

const GRACE_DAYS = 30;

route('GET', '/me/deletion', (ctx) => {
  requireUser(ctx);
  const open = [...db.bookings.values()].some((b) => OPEN.includes(b.status));
  return {
    canDelete: !open,
    reason: open ? 'open_bookings' : null,
    balancePaise: walletTotal(),
    passActive: !!activePass(),
    graceDays: GRACE_DAYS,
  };
});

// Scheduled, not erased: the session dies (logged out) and logging in again within 30 days restores
// the account, as on the backend. The mock never reaches the erasure date.
route('DELETE', '/me', (ctx) => {
  requireUser(ctx);
  if ([...db.bookings.values()].some((b) => OPEN.includes(b.status))) {
    throw new MockHttpError(409, 'CONFLICT', 'You have an upcoming booking. Contact support to cancel it first.');
  }
  if (!/^\d{6}$/.test(ctx.body?.otp ?? '')) throw new MockHttpError(422, 'VALIDATION_FAILED');
  if (ctx.body.otp !== MOCK_OTP) throw new MockHttpError(400, 'OTP_INVALID');
  pendingDeletion.add(me(ctx).phone); // its tokens stop working: logged out everywhere
  return { deletionDueAt: new Date(Date.now() + GRACE_DAYS * 86_400_000).toISOString() };
});

route('DELETE', '/addresses/:id', (ctx) => {
  requireUser(ctx);
  const i = addresses.findIndex((a) => a.id === ctx.params.id);
  if (i < 0) throw new MockHttpError(404, 'NOT_FOUND');
  addresses.splice(i, 1);
  return null;
});

// Push tokens: nothing to deliver in mock mode.
route('POST', '/devices', (ctx) => {
  requireUser(ctx);
  return null;
});
