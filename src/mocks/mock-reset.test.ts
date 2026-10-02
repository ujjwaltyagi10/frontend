// The mock keeps its data in memory, so an app reload wipes it while the app still holds a
// session. These tests pin how the mock recovers instead of failing with "not found".
import { api, isApiError, request } from '@/api';
import { useSessionStore } from '@/stores';

import { db } from './db';

const codeOf = (e: unknown) => (isApiError(e) ? e.code : 'none');

it('rebuilds the signed-in user from the phone in the token after a reset', async () => {
  await api.auth.sendOtp({ phone: '9123456782', whatsappOptIn: false });
  const r = await api.auth.verifyOtp({ phone: '9123456782', otp: '123456' });
  await useSessionStore.getState().signIn(r, r.user);

  db.me = null; // what an app reload does to the in-memory mock
  expect((await api.profile.me()).phone).toBe('9123456782');
});

it('answers 401 (so the app logs out) when the session cannot be recovered', async () => {
  db.me = null;
  const e = await request({ method: 'GET', path: '/me', auth: false }).catch((x: unknown) => x);
  expect(codeOf(e)).toBe('UNAUTHORIZED');
});
