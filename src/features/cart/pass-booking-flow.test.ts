// PS-3 Pass at booking through the real API client and the mock backend (no UI).
import { api, request, type CartInput } from '@/api';
import { newIdempotencyKey } from '@/lib/ids';
import { useSessionStore } from '@/stores';

const cart = (items: CartInput['items'], mode: CartInput['mode'] = 'scheduled'): CartInput => ({
  mode,
  items,
  addressId: 'a1',
  location: null,
  slotStart: mode === 'scheduled' ? '2026-10-05T04:00:00.000Z' : null,
  recurrence: mode === 'recurring' ? { daysOfWeek: [1], slotTime: '09:00' } : null,
  couponCode: null,
});

/** Plays the gateway webhook, then reads the payment past the mock's 3 s delivery delay. */
async function settle(paymentId: string) {
  await request({ method: 'POST', path: `/dev/payments/${paymentId}/outcome`, body: { outcome: 'success' } });
  const now = Date.now();
  const spy = jest.spyOn(Date, 'now').mockReturnValue(now + 5_000);
  try {
    return await api.checkout.getPayment(paymentId);
  } finally {
    spy.mockRestore();
  }
}

beforeAll(async () => {
  await api.auth.sendOtp({ phone: '9123456796', whatsappOptIn: false });
  const r = await api.auth.verifyOtp({ phone: '9123456796', otp: '123456' });
  await useSessionStore.getState().signIn(r, r.user);
});

it('applies the Pass automatically, uses one visit per booking, never on recurring', async () => {
  const hourly = [{ serviceSlug: 'hourly', durationMin: 60 }];
  expect((await api.cart.put(cart(hourly))).pass ?? null).toBeNull(); // no Pass yet

  const offer = await api.pass.offer();
  const buy = await api.checkout.createPayment({ purpose: 'pass', offerId: offer.id }, newIdempotencyKey());
  expect((await settle(buy.id)).status).toBe('succeeded');

  // 60-min Hourly is fully covered: items ₹0, fees ₹0 → nothing to pay.
  const q = await api.cart.put(cart(hourly));
  expect(q.pass).toMatchObject({ minutesCovered: 60, discountPaise: q.itemTotalPaise, visitsLeftAfter: 2 });
  expect(q.totalPaise).toBe(0);

  // 90 min: the Pass covers 60, the other 30 is paid (with fees on that part only).
  const longer = await api.cart.put(cart([{ serviceSlug: 'hourly', durationMin: 90 }]));
  expect(longer.pass?.minutesCovered).toBe(60);
  expect(longer.totalPaise).toBeGreaterThan(0);

  // Recurring is paid from ChoreDash Money only — no Pass.
  expect((await api.cart.put(cart(hourly, 'recurring'))).pass ?? null).toBeNull();

  // Booking the covered quote: ₹0 → confirmed straight away, and one visit is used.
  const booking = await api.checkout.createBooking({ quoteId: q.quoteId }, newIdempotencyKey());
  const pay = await api.checkout.createPayment(
    { purpose: 'booking', bookingId: booking.id },
    newIdempotencyKey(),
  );
  expect(pay).toMatchObject({ status: 'succeeded', amountPaise: 0 });
  expect(await api.pass.mine()).toMatchObject({ visitsUsed: 1, visitsTotal: 3 });
  expect((await api.cart.put(cart(hourly))).pass?.visitsLeftAfter).toBe(1);
});
