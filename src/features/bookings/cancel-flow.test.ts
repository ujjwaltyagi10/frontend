// Cancellation tiers through the real API client and the mock backend (no UI).
import { api, isApiError, request } from '@/api';
import { istDateKey, istToUtcIso } from '@/lib/format';
import { newIdempotencyKey } from '@/lib/ids';
import { useSessionStore } from '@/stores';

const HOUR = 3_600_000;
const codeOf = (e: unknown) => (isApiError(e) ? e.code : 'none');

/** Books and pays (test gateway) `minutes` of Hourly Service at `slotStart`; returns the booking. */
async function bookPaid(slotStart: string | null, minutes = 60) {
  const q = await api.cart.put({
    mode: slotStart ? 'scheduled' : 'instant',
    items: [{ serviceSlug: 'hourly', durationMin: minutes }],
    addressId: 'a1',
    location: null,
    slotStart,
    recurrence: null,
    couponCode: null,
  });
  const b = await api.checkout.createBooking({ quoteId: q.quoteId }, newIdempotencyKey());
  const p = await api.checkout.createPayment({ purpose: 'booking', bookingId: b.id }, newIdempotencyKey());
  await request({ method: 'POST', path: `/dev/payments/${p.id}/outcome`, body: { outcome: 'success' } });
  await at(Date.now() + 5_000, () => api.checkout.getPayment(p.id)); // past the webhook delay
  return { ...b, totalPaise: q.totalPaise };
}

/** Runs `fn` with the clock at `ms`. */
async function at<T>(ms: number, fn: () => Promise<T>): Promise<T> {
  const spy = jest.spyOn(Date, 'now').mockReturnValue(ms);
  try {
    return await fn();
  } finally {
    spy.mockRestore();
  }
}

beforeAll(async () => {
  await api.auth.sendOtp({ phone: '9123456794', whatsappOptIn: false });
  const r = await api.auth.verifyOtp({ phone: '9123456794', otp: '123456' });
  await useSessionStore.getState().signIn(r, r.user);
});

it('> 6 h before: free, everything back to ChoreDash Money; cancelling twice is refused', async () => {
  const slot = new Date(Date.now() + 2 * 24 * HOUR).toISOString();
  const b = await bookPaid(slot);
  const before = (await api.wallet.get()).totalPaise;

  const detail = await api.bookings.detail(b.id);
  expect(detail).toMatchObject({
    cancellationFeePercent: 0,
    cancellationFeePaise: 0,
    cancellationRefundPaise: b.totalPaise,
  });

  const r = await api.bookings.cancel(b.id, newIdempotencyKey());
  expect(r).toMatchObject({
    cancellationFeePercent: 0,
    feePaise: 0,
    refundPaise: b.totalPaise,
    refundTo: 'wallet',
  });
  expect((await api.wallet.get()).totalPaise).toBe(before + b.totalPaise);
  expect((await api.bookings.detail(b.id)).status).toBe('cancelled');

  expect(codeOf(await api.bookings.cancel(b.id, newIdempotencyKey()).catch((e: unknown) => e))).toBe(
    'CONFLICT',
  );
});

it('3–6 h before: 50% fee, the other half back', async () => {
  const slotMs = Date.now() + 3 * 24 * HOUR;
  const b = await bookPaid(new Date(slotMs).toISOString());
  const r = await at(slotMs - 4 * HOUR, () => api.bookings.cancel(b.id, newIdempotencyKey()));
  const fee = Math.floor((b.totalPaise * 50 + 50) / 100);
  expect(r).toMatchObject({ cancellationFeePercent: 50, feePaise: fee, refundPaise: b.totalPaise - fee });
});

it('under 3 h: 100% fee, capped at ₹500', async () => {
  const slotMs = Date.now() + 4 * 24 * HOUR;
  const small = await bookPaid(new Date(slotMs).toISOString(), 60); // well under ₹500
  const r1 = await at(slotMs - HOUR, () => api.bookings.cancel(small.id, newIdempotencyKey()));
  expect(r1).toMatchObject({ cancellationFeePercent: 100, feePaise: small.totalPaise, refundPaise: 0 });

  const big = await bookPaid(new Date(slotMs + 24 * HOUR).toISOString(), 1200); // 20 h of Hourly
  expect(big.totalPaise).toBeGreaterThan(50_000);
  const r2 = await at(slotMs + 24 * HOUR - HOUR, () => api.bookings.cancel(big.id, newIdempotencyKey()));
  expect(r2).toMatchObject({
    cancellationFeePercent: 100,
    feePaise: 50_000,
    refundPaise: big.totalPaise - 50_000,
  });
});

it('reschedules for free until 90 min before the slot, then refuses', async () => {
  const day = istDateKey(new Date(), 3);
  const b = await bookPaid(istToUtcIso(day, '10:00'));
  const until = (await api.bookings.detail(b.id)).rescheduleUntil!;
  expect(Date.parse(until)).toBe(Date.parse(istToUtcIso(day, '10:00')) - 90 * 60_000);

  const before = (await api.wallet.get()).totalPaise;
  const moved = await api.bookings.reschedule(b.id, istToUtcIso(day, '14:00'), newIdempotencyKey());
  expect(moved.slotStart).toBe(istToUtcIso(day, '14:00'));
  expect((await api.wallet.get()).totalPaise).toBe(before); // nothing charged

  const late = await at(Date.parse(istToUtcIso(day, '14:00')) - 60 * 60_000, () =>
    api.bookings.reschedule(b.id, istToUtcIso(day, '16:00'), newIdempotencyKey()).catch((e: unknown) => e),
  );
  expect(codeOf(late)).toBe('CONFLICT');
});

describe('instant bookings: 5 minutes to reschedule or cancel for free', () => {
  const tenAm = Date.parse(istToUtcIso(istDateKey(new Date(), 5), '10:00'));
  beforeEach(() =>
    jest.useFakeTimers({
      now: tenAm,
      doNotFake: ['setTimeout', 'setImmediate', 'nextTick', 'queueMicrotask'],
    }),
  );
  afterEach(() => jest.useRealTimers());

  it('cancels free within 5 minutes; reschedule window closes after 5', async () => {
    const a = await bookPaid(null);
    const detail = await api.bookings.detail(a.id);
    expect(detail.mode).toBe('instant');
    expect(detail.cancellationFeePercent).toBe(0);
    jest.setSystemTime(Date.now() + 4 * 60_000);
    const r = await api.bookings.cancel(a.id, newIdempotencyKey());
    expect(r).toMatchObject({ cancellationFeePercent: 0, refundPaise: a.totalPaise });

    const b = await bookPaid(null);
    jest.setSystemTime(Date.now() + 6 * 60_000);
    const late = await api.bookings
      .reschedule(b.id, istToUtcIso(istDateKey(new Date(), 1), '10:00'), newIdempotencyKey())
      .catch((e: unknown) => e);
    expect(codeOf(late)).toBe('CONFLICT');
    expect((await api.bookings.detail(b.id)).cancellationFeePercent).toBe(100);
  });
});
