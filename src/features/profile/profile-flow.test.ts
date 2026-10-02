// Profile + account deletion through the real API client and the mock backend (no UI).
import { api, isApiError } from '@/api';
import { useSessionStore } from '@/stores';

async function login(phone: string) {
  await api.auth.sendOtp({ phone, whatsappOptIn: false });
  const r = await api.auth.verifyOtp({ phone, otp: '123456' });
  await useSessionStore.getState().signIn(r, r.user);
  return r;
}

const codeOf = (e: unknown) => (isApiError(e) ? e.code : 'none');

describe('profile (mock backend)', () => {
  it('edits name and email with the same rules as the backend', async () => {
    await login('9123456780');
    const me = await api.profile.update({ firstName: '  Aditya ', email: 'Aditya@Example.COM' });
    expect(me).toMatchObject({ firstName: 'Aditya', email: 'aditya@example.com', phone: '9123456780' });
    expect(codeOf(await api.profile.update({ email: 'nope' }).catch((e: unknown) => e))).toBe(
      'VALIDATION_FAILED',
    );
    expect((await api.profile.update({ email: '' })).email).toBeNull();
  });

  it('needs the OTP to delete, and erases the account', async () => {
    await login('9123456781');
    expect(codeOf(await api.profile.remove('000000').catch((e: unknown) => e))).toBe('OTP_INVALID');
    await api.profile.remove('123456');
    // Like the real backend: sessions are revoked, so the old token is refused.
    expect(codeOf(await api.profile.me().catch((e: unknown) => e))).toBe('UNAUTHORIZED');
    // Same number signs up again as a new account.
    expect((await login('9123456781')).isNewUser).toBe(true);
  });
});
