import type { Booking } from '@/api/types';

import { db, newId, once } from '../db';
import { MockHttpError, requireUser, route } from '../router';
import { refundToWallet } from './wallet';
import { bookDueVisits } from './recurring';

const UPCOMING = ['confirmed', 'assigned', 'in_progress'];
const CANCELLABLE = ['confirmed', 'assigned'];
const HOUR = 3_600_000;
const MAX_FEE = 50_000; // the 100% tier is capped at ₹500

const INSTANT_FREE_MS = 5 * 60_000;
const RESCHEDULE_CUTOFF_MS = 90 * 60_000;

/**
 * Same tiers as the backend: instant bookings are free to cancel for 5 min after confirmation;
 * otherwise > 6 h free, 3–6 h 50%, < 3 h or assigned 100% (max ₹500).
 */
function cancellationTerms(b: Booking, now = Date.now()) {
  const hours = (Date.parse(b.slotStart) - now) / HOUR;
  const confirmedAt = db.bookingMeta.get(b.id)?.confirmedAt;
  const instantWindow =
    b.mode === 'instant' &&
    b.status === 'confirmed' &&
    !!confirmedAt &&
    now - Date.parse(confirmedAt) <= INSTANT_FREE_MS;
  const percent: 0 | 50 | 100 = instantWindow
    ? 0
    : b.status === 'assigned'
      ? 100
      : hours > 6
        ? 0
        : hours >= 3
          ? 50
          : 100;
  let fee = Math.floor((b.totalPaise * percent + 50) / 100);
  if (percent === 100) fee = Math.min(fee, MAX_FEE);
  return { percent, fee, refund: b.totalPaise - fee };
}
const PAST = ['completed', 'cancelled'];

route('GET', '/bookings', (ctx) => {
  requireUser(ctx);
  bookDueVisits();
  const wanted = ctx.query?.status === 'past' ? PAST : UPCOMING;
  const items = [...db.bookings.values()]
    .filter((b) => wanted.includes(b.status))
    // Bookings saved before slugs were stored: take them from the quote they were made from.
    .map((b) =>
      b.serviceSlugs
        ? b
        : { ...b, serviceSlugs: db.bookingMeta.get(b.id)?.quote.lines.map((l) => l.serviceSlug) },
    )
    .sort((a, b) => a.slotStart.localeCompare(b.slotStart));
  return { items, nextCursor: null };
});

route('POST', '/bookings', (ctx) => {
  requireUser(ctx);
  if (!ctx.headers['Idempotency-Key'])
    throw new MockHttpError(422, 'VALIDATION_FAILED', 'Idempotency-Key required');
  return once(ctx.headers['Idempotency-Key'], () => {
    const saved = db.quotes.get(ctx.body?.quoteId);
    if (!saved) throw new MockHttpError(409, 'CONFLICT', 'Quote expired. Please review your cart.');
    const { input, quote } = saved;
    if (input.mode === 'instant' && !quote.instant.available) {
      throw new MockHttpError(409, 'LARGE_ORDER_SCHEDULE_ONLY');
    }
    if (input.mode === 'scheduled' && !input.slotStart) throw new MockHttpError(422, 'VALIDATION_FAILED');
    const now = Date.now();
    const booking: Booking = {
      id: newId('bk'),
      mode: input.mode,
      status: 'pending_payment',
      slotStart: input.slotStart ?? new Date(now + 30 * 60_000).toISOString(),
      durationMin: input.items.reduce((s, i) => s + i.durationMin, 0),
      serviceNames: quote.lines.map((l) => l.name),
      serviceSlugs: quote.lines.map((l) => l.serviceSlug),
      addressLine: 'Saved address',
      totalPaise: quote.totalPaise,
      holdExpiresAt: new Date(now + 10 * 60_000).toISOString(),
    };
    db.bookings.set(booking.id, booking);
    db.bookingMeta.set(booking.id, { quote, createdAt: new Date(now).toISOString(), confirmedAt: null });
    return booking;
  });
});

route('GET', '/bookings/:id', (ctx) => {
  requireUser(ctx);
  const b = db.bookings.get(ctx.params.id);
  const meta = db.bookingMeta.get(ctx.params.id);
  // Like the backend: unpaid checkout attempts aren't bookings yet.
  if (!b || !meta || b.status === 'pending_payment' || b.status === 'payment_failed') {
    throw new MockHttpError(404, 'NOT_FOUND');
  }
  const { holdExpiresAt: _h, ...summary } = b;
  return {
    ...summary,
    slotEnd: new Date(Date.parse(b.slotStart) + b.durationMin * 60_000).toISOString(),
    items: meta.quote.lines.map((l) => ({
      name: l.name,
      durationMin: l.durationMin,
      pricePaise: l.pricePaise,
      mrpPaise: l.mrpPaise,
    })),
    bill: {
      itemTotalPaise: meta.quote.itemTotalPaise,
      discountPaise: meta.quote.discountPaise,
      feesPaise: meta.quote.feesPaise,
      totalPaise: meta.quote.totalPaise,
      couponCode: meta.quote.coupon?.valid ? meta.quote.coupon.code : null,
    },
    timeline: [
      { status: 'pending_payment', at: meta.createdAt },
      ...(meta.confirmedAt ? [{ status: 'confirmed', at: meta.confirmedAt }] : []),
      ...(meta.cancelledAt ? [{ status: 'cancelled', at: meta.cancelledAt }] : []),
    ],
    partner: null,
    arrivalEstimate: null,
    ...(() => {
      const t = cancellationTerms(b);
      const can = CANCELLABLE.includes(b.status);
      return {
        cancellationFeePercent: t.percent,
        cancellationFeePaise: can ? t.fee : null,
        cancellationRefundPaise: can ? t.refund : null,
        rescheduleUntil: rescheduleUntil(b),
      };
    })(),
  };
});

/** Like the backend: 90 min before the slot; instant bookings within 5 min of confirmation. */
function rescheduleUntil(b: Booking): string | null {
  if (b.status !== 'confirmed') return null;
  if (b.mode === 'instant') {
    const confirmedAt = db.bookingMeta.get(b.id)?.confirmedAt;
    return confirmedAt ? new Date(Date.parse(confirmedAt) + INSTANT_FREE_MS).toISOString() : null;
  }
  return new Date(Date.parse(b.slotStart) - RESCHEDULE_CUTOFF_MS).toISOString();
}

route('POST', '/bookings/:id/reschedule', (ctx) => {
  requireUser(ctx);
  return once(ctx.headers['Idempotency-Key'], () => {
    const b = db.bookings.get(ctx.params.id);
    if (!b || !db.bookingMeta.get(b.id)) throw new MockHttpError(404, 'NOT_FOUND');
    const until = rescheduleUntil(b);
    if (!until) throw new MockHttpError(409, 'CONFLICT', "This booking can't be rescheduled.");
    if (Date.now() > Date.parse(until))
      throw new MockHttpError(
        409,
        'CONFLICT',
        b.mode === 'instant'
          ? 'Instant bookings can be rescheduled within 5 minutes of booking.'
          : 'Bookings can be rescheduled up to 90 minutes before the slot.',
      );
    const slot = String(ctx.body?.slotStart ?? '');
    const at = Date.parse(slot);
    if (Number.isNaN(at)) throw new MockHttpError(422, 'VALIDATION_FAILED');
    // Like booking create: at least an hour away, on the 30-min grid, inside service hours.
    const istMin = (((at / 60_000 + 330) % 1440) + 1440) % 1440;
    if (at < Date.now() + HOUR || istMin % 30 !== 0 || istMin < 7 * 60 || istMin + b.durationMin > 21 * 60)
      throw new MockHttpError(409, 'SLOT_UNAVAILABLE');
    b.slotStart = new Date(at).toISOString();
    return { ...b };
  });
});

route('POST', '/bookings/:id/cancel', (ctx) => {
  requireUser(ctx);
  return once(ctx.headers['Idempotency-Key'], () => {
    const b = db.bookings.get(ctx.params.id);
    if (!b || !db.bookingMeta.get(b.id)) throw new MockHttpError(404, 'NOT_FOUND');
    if (!CANCELLABLE.includes(b.status))
      throw new MockHttpError(409, 'CONFLICT', 'This booking can no longer be cancelled in the app.');
    const t = cancellationTerms(b);
    refundToWallet(t.refund, `Refund · ${b.serviceNames.join(', ')}`);
    b.status = 'cancelled';
    const meta = db.bookingMeta.get(b.id)!;
    meta.cancelledAt = new Date().toISOString();
    return {
      booking: { ...b },
      cancellationFeePercent: t.percent,
      feePaise: t.fee,
      refundPaise: t.refund,
      refundTo: 'wallet' as const,
    };
  });
});
