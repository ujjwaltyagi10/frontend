// PY-6 Quick Checkout through the real API client and the mock backend (no UI).
import { api, isApiError } from '@/api';
import { newIdempotencyKey } from '@/lib/ids';
import { useSessionStore } from '@/stores';

const codeOf = (e: unknown) => (isApiError(e) ? e.code : 'none');

const cart = {
  mode: 'scheduled' as const,
  items: [{ serviceSlug: 'hourly', durationMin: 60 }],
  addressId: 'a1',
  location: null,
  slotStart: '2026-10-02T04:00:00.000Z',
  recurrence: null,
  couponCode: null,
};

beforeAll(async () => {
  await api.auth.sendOtp({ phone: '9123456798', whatsappOptIn: false });
  const r = await api.auth.verifyOtp({ phone: '9123456798', otp: '123456' });
  await useSessionStore.getState().signIn(r, r.user);
});

it('pays a held booking from ChoreDash Money in one step, once', async () => {
  const quote = await api.cart.put(cart);
  const booking = await api.checkout.createBooking({ quoteId: quote.quoteId }, newIdempotencyKey());

  // Empty wallet → refused, nothing booked.
  const short = await api.wallet.payBooking(booking.id, newIdempotencyKey()).catch((e: unknown) => e);
  expect(codeOf(short)).toBe('INSUFFICIENT_BALANCE');

  await api.wallet.redeemGiftCard('CHOREDASH100', newIdempotencyKey()); // ₹100
  const key = newIdempotencyKey();
  const paid = await api.wallet.payBooking(booking.id, key);
  expect(paid.booking).toMatchObject({ id: booking.id, status: 'confirmed', totalPaise: quote.totalPaise });
  expect(paid.wallet.totalPaise).toBe(10_000 - quote.totalPaise);

  // A retry with the same key replays; it doesn't charge twice.
  const again = await api.wallet.payBooking(booking.id, key);
  expect(again.wallet.totalPaise).toBe(paid.wallet.totalPaise);
  expect((await api.wallet.get()).totalPaise).toBe(10_000 - quote.totalPaise);

  // Shows in My Bookings like any paid booking.
  expect((await api.bookings.list('upcoming')).items.map((b) => b.id)).toContain(booking.id);
});
