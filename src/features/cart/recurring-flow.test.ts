// Weekly plans through the real API client and the mock backend (no UI).
import { api, isApiError, type CartInput } from '@/api';
import { newIdempotencyKey } from '@/lib/ids';
import { useSessionStore } from '@/stores';

const codeOf = (e: unknown) => (isApiError(e) ? e.code : 'none');

const recurringCart: CartInput = {
  mode: 'recurring',
  items: [{ serviceSlug: 'utensils', durationMin: 30 }],
  addressId: 'a1',
  location: null,
  slotStart: null,
  recurrence: { daysOfWeek: [1, 3, 5], slotTime: '09:00' },
  couponCode: null,
};

beforeAll(async () => {
  const phone = '9123456795';
  await api.auth.sendOtp({ phone, whatsappOptIn: false });
  const r = await api.auth.verifyOtp({ phone, otp: '123456' });
  await useSessionStore.getState().signIn(r, r.user);
});

describe('weekly plans (mock backend)', () => {
  it('needs ChoreDash Money for the first visit, then starts, lists and stops', async () => {
    const quote = await api.cart.put(recurringCart);
    const empty = await api.recurring.create(quote.quoteId, newIdempotencyKey()).catch((e: unknown) => e);
    expect(codeOf(empty)).toBe('INSUFFICIENT_BALANCE');

    await api.wallet.redeemGiftCard('CHOREDASH100', newIdempotencyKey());
    const plan = await api.recurring.create(quote.quoteId, newIdempotencyKey());
    expect(plan).toMatchObject({ status: 'active', daysOfWeek: [1, 3, 5], slotTime: '09:00' });
    expect(plan.perVisitPaise).toBe(quote.totalPaise); // the server's per-visit price, not the app's
    expect([1, 3, 5]).toContain(new Date(new Date(plan.nextVisitAt!).getTime() + 330 * 60_000).getUTCDay());

    expect((await api.recurring.list()).map((p) => p.id)).toContain(plan.id);
    const stopped = await api.recurring.stop(plan.id);
    expect(stopped).toMatchObject({ status: 'stopped', nextVisitAt: null });
  });

  it('books visits due within 48 h from the wallet, so they show in Upcoming', async () => {
    const daily = await api.cart.put({
      ...recurringCart,
      recurrence: { daysOfWeek: [0, 1, 2, 3, 4, 5, 6], slotTime: '09:00' },
    });
    const before = (await api.wallet.get()).totalPaise;
    const plan = await api.recurring.create(daily.quoteId, newIdempotencyKey());

    const upcoming = (await api.bookings.list('upcoming')).items.filter((b) => b.mode === 'recurring');
    expect(upcoming.length).toBeGreaterThan(0); // the next visit (within 48 h) is already booked
    expect(upcoming[0]).toMatchObject({ status: 'confirmed', totalPaise: plan.perVisitPaise });
    expect((await api.wallet.get()).totalPaise).toBe(before - upcoming.length * plan.perVisitPaise);
    // …and the plan has moved on past the visits it booked
    expect(Date.parse(plan.nextVisitAt!)).toBeGreaterThan(
      Date.parse(upcoming[upcoming.length - 1].slotStart),
    );
  });
});
