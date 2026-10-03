// Referral through the real API client and the mock backend (no UI).
import { api } from '@/api';
import { useSessionStore } from '@/stores';

it('returns the code, tier and earnings from the server', async () => {
  const phone = '9123456797';
  await api.auth.sendOtp({ phone, whatsappOptIn: false });
  const r0 = await api.auth.verifyOtp({ phone, otp: '123456' });
  await useSessionStore.getState().signIn(r0, r0.user);
  await api.profile.update({ firstName: 'Ujjwal' });

  const r = await api.referral.get();
  expect(r.code).toBe('UJJWAL797');
  expect(r.shareUrl).toContain(r.code);
  expect(r.tiers.map((t) => t.name)).toEqual(['Champ', 'Star', 'Legend']);
  expect(r.currentTierId).toBe('champ');
  expect(r.earnedPaise).toBe(r.completedCount * 10_000);
});
