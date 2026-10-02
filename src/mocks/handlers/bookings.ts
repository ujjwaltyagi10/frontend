import type { Booking } from '@/api/types';

import { db, newId, once } from '../db';
import { MockHttpError, requireUser, route } from '../router';

const UPCOMING = ['confirmed', 'assigned', 'in_progress'];
const PAST = ['completed', 'cancelled'];

route('GET', '/bookings', (ctx) => {
  requireUser(ctx);
  const wanted = ctx.query?.status === 'past' ? PAST : UPCOMING;
  const items = [...db.bookings.values()]
    .filter((b) => wanted.includes(b.status))
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
    ],
    partner: null,
    arrivalEstimate: null,
  };
});
