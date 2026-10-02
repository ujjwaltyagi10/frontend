import { db } from '../db';
import { persisted, setPart } from '../persist';
import { MockHttpError, route } from '../router';

/** Any number works; this OTP always verifies in mock mode. */
export const MOCK_OTP = '123456';

let wrongAttempts = 0;

// Mock tokens carry the phone, so the mock can rebuild the signed-in user after an app reload
// wipes its in-memory state (see profile handler). Real tokens are opaque JWTs.
const tokens = (kind: 'user' | 'guest', phone?: string) => {
  const who = kind === 'user' && phone ? `user-${phone}` : kind;
  return {
    accessToken: `mock-access-${who}-${Date.now()}`,
    refreshToken: `mock-refresh-${who}-${Date.now()}`,
  };
};

/** The phone inside a mock user token ("Bearer mock-access-user-9876543210-…"), if any. */
export const phoneFromToken = (token: string | undefined) =>
  /-user-([6-9]\d{9})-/.exec(token ?? '')?.[1] ?? null;

/** Accounts deleted in this run: their old tokens must not bring them back. */
export const deletedPhones = new Set<string>();
persisted('deletedPhones', setPart(deletedPhones));

route('POST', '/auth/otp/send', ({ body }) => {
  if (!/^[6-9]\d{9}$/.test(body?.phone ?? '')) throw new MockHttpError(422, 'VALIDATION_FAILED');
  wrongAttempts = 0;
  return { resendAfterSec: 45 };
});

route('POST', '/auth/otp/verify', ({ body }) => {
  if (wrongAttempts >= 5) throw new MockHttpError(429, 'OTP_LOCKED');
  if (body?.otp !== MOCK_OTP) {
    wrongAttempts += 1;
    throw new MockHttpError(400, 'OTP_INVALID');
  }
  const isNewUser = db.me?.phone !== body.phone;
  if (isNewUser) {
    db.me = {
      id: `u_${body.phone}`,
      phone: body.phone,
      firstName: null,
      lastName: null,
      email: null,
      whatsappOptIn: false,
    };
  }
  const { whatsappOptIn: _w, ...user } = db.me!;
  deletedPhones.delete(body.phone); // signing up again is a new account
  return { ...tokens('user', body.phone), isNewUser, user };
});

route('POST', '/auth/guest', () => tokens('guest'));

route('POST', '/auth/refresh', ({ body }) => {
  const token = String(body?.refreshToken);
  if (token.includes('guest')) return tokens('guest');
  const phone = phoneFromToken(token);
  if (!phone || deletedPhones.has(phone)) throw new MockHttpError(401, 'UNAUTHORIZED');
  return tokens('user', phone);
});

route('POST', '/auth/logout', () => null);

/** Dev: wipe the mock backend back to its fixtures (Component gallery → Reset mock data). */
route('POST', '/dev/mock/reset', async () => {
  const { resetAll } = await import('../persist');
  await resetAll();
  return null;
});
