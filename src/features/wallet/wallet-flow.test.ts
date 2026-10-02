// Wallet + Pass through the real API client and the mock backend (no UI).
import { api, isApiError, request } from '@/api';
import { useSessionStore } from '@/stores';

async function login() {
  await api.auth.sendOtp({ phone: '9876543210', whatsappOptIn: false });
  const r = await api.auth.verifyOtp({ phone: '9876543210', otp: '123456' });
  await useSessionStore.getState().signIn(r, r.user);
}

/** Plays the gateway webhook (again — duplicates must be ignored) and jumps past its 3 s delay. */
async function settle(paymentId: string, outcome: 'success' | 'failure') {
  await request({ method: 'POST', path: `/dev/payments/${paymentId}/outcome`, body: { outcome } });
  const realNow = Date.now;
  jest.spyOn(Date, 'now').mockImplementation(() => realNow() + 4_000);
  const p = await api.checkout.getPayment(paymentId);
  jest.restoreAllMocks();
  return p;
}

describe('ChoreDash Money (mock backend)', () => {
  beforeAll(login);

  it('credits a top-up plus the 5% bonus only after the payment succeeds', async () => {
    const before = await api.wallet.get();
    const pay = await api.checkout.createPayment({ purpose: 'topup', amountPaise: 50_000 }, 'topup-1');
    await request({
      method: 'POST',
      path: `/dev/payments/${pay.id}/outcome`,
      body: { outcome: 'success' },
    });

    const pending = await api.wallet.transactions();
    expect(pending.items.slice(0, 2).map((t) => [t.kind, t.status, t.amountPaise])).toEqual([
      ['bonus', 'pending', 2_500],
      ['topup', 'pending', 50_000],
    ]);
    expect((await api.wallet.get()).totalPaise).toBe(before.totalPaise); // not yet

    expect((await settle(pay.id, 'success')).status).toBe('succeeded');
    const after = await api.wallet.get();
    expect(after.cashBalancePaise - before.cashBalancePaise).toBe(50_000);
    expect(after.promoBalancePaise - before.promoBalancePaise).toBe(2_500);
  });

  it('rejects top-ups outside ₹1–₹10,000', async () => {
    const e = await api.checkout
      .createPayment({ purpose: 'topup', amountPaise: 1_000_100 }, 'topup-2')
      .catch((x: unknown) => x);
    expect(isApiError(e) && e.code).toBe('VALIDATION_FAILED');
  });

  it('redeems a gift card once, and locks after 5 wrong codes', async () => {
    const ok = await api.wallet.redeemGiftCard('CHOREDASH100', 'gc-1');
    expect(ok.creditedPaise).toBe(10_000);
    const codes: string[] = [];
    for (let i = 0; i < 5; i++) {
      const e = await api.wallet.redeemGiftCard(`WRONG${i}`, `gc-w${i}`).catch((x: unknown) => x);
      codes.push(isApiError(e) ? e.code : 'none');
    }
    expect(codes).toEqual([
      'GIFT_CARD_INVALID',
      'GIFT_CARD_INVALID',
      'GIFT_CARD_INVALID',
      'GIFT_CARD_INVALID',
      'GIFT_CARD_LOCKED',
    ]);
  });
});

describe('ChoreDash Pass (mock backend)', () => {
  beforeAll(login);

  it('activates a Pass after paying the server price incl. taxes', async () => {
    expect(await api.pass.mine()).toBeNull();
    const offer = await api.pass.offer();
    const pay = await api.checkout.createPayment({ purpose: 'pass', offerId: offer.id }, 'pass-1');
    expect(pay.amountPaise).toBe(10_395);
    await settle(pay.id, 'success');
    const mine = await api.pass.mine();
    expect(mine).toMatchObject({ visitsTotal: 3, visitsUsed: 0, minutesPerVisit: 60, status: 'active' });
  });
});
