// End-to-end through the real API client and the mock backend (no UI): proves the contract
// the screens rely on — server-set amounts, idempotent booking creation, webhook-driven status.
import { api, isApiError, request } from '@/api';
import { useSessionStore } from '@/stores';

const cart = {
  mode: 'scheduled' as const,
  items: [{ serviceSlug: 'hourly', durationMin: 60 }],
  addressId: 'a1',
  location: null,
  slotStart: '2026-10-02T04:00:00.000Z',
  recurrence: null,
  couponCode: 'FIRST50',
};

async function login() {
  await api.auth.sendOtp({ phone: '9876543210', whatsappOptIn: false });
  const r = await api.auth.verifyOtp({ phone: '9876543210', otp: '123456' });
  await useSessionStore.getState().signIn(r, r.user);
}

describe('booking → payment flow (mock backend)', () => {
  beforeAll(login);

  it('confirms the booking only after the gateway webhook, at the server amount', async () => {
    const quote = await api.cart.put(cart);
    // ₹49 for 1 hr − ₹50 coupon capped at ₹49 → ₹0 + fees ₹0
    expect(quote.discountPaise).toBe(4_900);

    const noCoupon = await api.cart.put({ ...cart, couponCode: null });
    expect(noCoupon.totalPaise).toBe(4_900 + 245); // 5% fees

    const booking = await api.checkout.createBooking({ quoteId: noCoupon.quoteId }, 'key-1');
    expect(booking.status).toBe('pending_payment');

    // Same key (double tap / retry) → same booking, not a second one.
    const again = await api.checkout.createBooking({ quoteId: noCoupon.quoteId }, 'key-1');
    expect(again.id).toBe(booking.id);

    const payment = await api.checkout.createPayment({ purpose: 'booking', bookingId: booking.id }, 'pay-1');
    expect(payment.amountPaise).toBe(noCoupon.totalPaise); // set by the server
    expect(payment.status).toBe('created');

    // Gateway reports success; the "webhook" lands 3 s later.
    const realNow = Date.now;
    await request({
      method: 'POST',
      path: `/dev/payments/${payment.id}/outcome`,
      body: { outcome: 'success' },
    });
    expect((await api.checkout.getPayment(payment.id)).status).toBe('pending');
    jest.spyOn(Date, 'now').mockImplementation(() => realNow() + 4_000);
    const final = await api.checkout.getPayment(payment.id);
    jest.restoreAllMocks();

    expect(final.status).toBe('succeeded');
    expect(final.booking?.status).toBe('confirmed');
    const upcoming = await api.bookings.list('upcoming');
    expect(upcoming.items.map((b) => b.id)).toContain(booking.id);
  });

  it('cancels a payment the user walked away from (F6)', async () => {
    const q = await api.cart.put({ ...cart, couponCode: null });
    const b = await api.checkout.createBooking({ quoteId: q.quoteId }, 'key-2');
    const p = await api.checkout.createPayment({ purpose: 'booking', bookingId: b.id }, 'pay-2');
    expect((await api.checkout.cancelPayment(p.id)).status).toBe('cancelled');
  });

  it('rejects an unknown quote', async () => {
    const error = await api.checkout.createBooking({ quoteId: 'nope' }, 'key-3').catch((e: unknown) => e);
    expect(isApiError(error) && error.code).toBe('CONFLICT');
  });
});
