// A new user's friend code at signup, through the real API client and the mock backend (no UI).
import { api, isApiError } from '@/api';
import { newIdempotencyKey } from '@/lib/ids';
import { useSessionStore } from '@/stores';

const codeOf = (e: unknown) => (isApiError(e) ? e.code : 'none');

it('credits ₹50 to ChoreDash Money once, refuses own and repeat codes', async () => {
  const phone = '9123456793';
  await api.auth.sendOtp({ phone, whatsappOptIn: false });
  const r = await api.auth.verifyOtp({ phone, otp: '123456' });
  expect(r.isNewUser).toBe(true);
  await useSessionStore.getState().signIn(r, r.user, { isNewUser: r.isNewUser });
  expect(useSessionStore.getState().offerReferral).toBe(true); // the app asks once

  await api.profile.update({ firstName: 'Ravi' });
  const own = (await api.referral.get()).code;
  expect(codeOf(await api.referral.redeem(own, newIdempotencyKey()).catch((e: unknown) => e))).toBe(
    'REFERRAL_INVALID',
  );
  expect(codeOf(await api.referral.redeem('NOPE', newIdempotencyKey()).catch((e: unknown) => e))).toBe(
    'REFERRAL_INVALID',
  );

  const before = await api.wallet.get();
  const key = newIdempotencyKey();
  const ok = await api.referral.redeem('PRIYA123', key);
  expect(ok.creditedPaise).toBe(5_000);
  expect(ok.wallet.promoBalancePaise).toBe(before.promoBalancePaise + 5_000);
  // Same tap retried → same answer, not a second ₹50.
  expect((await api.referral.redeem('PRIYA123', key)).wallet.totalPaise).toBe(ok.wallet.totalPaise);
  expect((await api.wallet.get()).totalPaise).toBe(ok.wallet.totalPaise);

  // Only once per account.
  expect(codeOf(await api.referral.redeem('ANITA456', newIdempotencyKey()).catch((e: unknown) => e))).toBe(
    'REFERRAL_NOT_ELIGIBLE',
  );
});
