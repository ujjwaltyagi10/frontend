// Mock payments. The real flow: app creates a payment → opens the gateway SDK → the gateway
// tells our backend the result by webhook → the app polls GET /payments/{id}. Here the mock
// gateway sheet calls POST /dev/payments/{id}/outcome (same route as the Go backend's dev build) to play the webhook, which "arrives"
// 3 seconds later so the app's polling and loader are exercised.
import type { Payment } from '@/api/types';

import { db, newId, once } from '../db';
import { MockHttpError, requireUser, route } from '../router';
import { passOffer, passPurchased, topupPending, topupSettled } from './wallet';

const WEBHOOK_DELAY_MS = 3000;

function view(id: string): Payment {
  const p = db.payments.get(id);
  if (!p) throw new MockHttpError(404, 'NOT_FOUND');
  if (p.status === 'pending' && p.resolveAt && Date.now() >= p.resolveAt) {
    p.status = p.outcome === 'success' ? 'succeeded' : 'failed';
    p.errorCode = p.outcome === 'success' ? null : 'PAYMENT_FAILED';
    const booking = p.bookingId ? db.bookings.get(p.bookingId) : undefined;
    if (booking) booking.status = p.status === 'succeeded' ? 'confirmed' : 'payment_failed';
    const meta = p.bookingId ? db.bookingMeta.get(p.bookingId) : undefined;
    if (meta && p.status === 'succeeded') meta.confirmedAt = new Date().toISOString();
    if (p.purpose === 'topup') topupSettled(p.id, p.status === 'succeeded');
    if (p.purpose === 'pass' && p.status === 'succeeded') passPurchased();
  }
  const { resolveAt: _r, outcome: _o, ...rest } = p;
  const booking = p.bookingId ? db.bookings.get(p.bookingId) : undefined;
  return { ...rest, booking: p.status === 'succeeded' && booking ? booking : null };
}

route('POST', '/payments', (ctx) => {
  requireUser(ctx);
  return once(ctx.headers['Idempotency-Key'], () => {
    const b = ctx.body ?? {};
    let amountPaise: number;
    if (b.purpose === 'booking') {
      const booking = db.bookings.get(b.bookingId);
      if (!booking || booking.status !== 'pending_payment') throw new MockHttpError(409, 'CONFLICT');
      amountPaise = booking.totalPaise; // server-side amount; anything the app sends is ignored
    } else if (b.purpose === 'topup') {
      amountPaise = Number(b.amountPaise);
      if (!Number.isInteger(amountPaise) || amountPaise < 100 || amountPaise > 1_000_000) {
        throw new MockHttpError(422, 'VALIDATION_FAILED', 'Top-up must be ₹1–₹10,000');
      }
    } else {
      if (b.offerId !== passOffer.id) throw new MockHttpError(404, 'NOT_FOUND');
      amountPaise = passOffer.totalWithTaxPaise;
    }
    const id = newId('pay');
    db.payments.set(id, {
      id,
      purpose: b.purpose,
      status: 'created',
      amountPaise,
      gateway: { provider: 'razorpay', orderId: newId('order'), keyId: 'rzp_test_mock' },
      bookingId: b.purpose === 'booking' ? b.bookingId : null,
      booking: null,
      errorCode: null,
      resolveAt: null,
      outcome: null,
    });
    return view(id);
  });
});

route('GET', '/payments/:id', (ctx) => {
  requireUser(ctx);
  return view(ctx.params.id);
});

route('POST', '/payments/:id/cancel', (ctx) => {
  requireUser(ctx);
  const p = db.payments.get(ctx.params.id);
  if (!p) throw new MockHttpError(404, 'NOT_FOUND');
  if (p.status === 'created') p.status = 'cancelled';
  return view(p.id);
});

/** Dev-only (also on the Go backend in development): plays the gateway webhook. `never` leaves the payment pending (tests the 60 s timeout). */
route('POST', '/dev/payments/:id/outcome', (ctx) => {
  const p = db.payments.get(ctx.params.id);
  if (!p) throw new MockHttpError(404, 'NOT_FOUND');
  // Gateways can deliver the same event twice; only the first one may move money.
  if (p.status !== 'created') return null;
  p.status = 'pending';
  p.outcome = ctx.body?.outcome ?? 'success';
  if (p.purpose === 'topup') topupPending(p.id, p.amountPaise);
  p.resolveAt = p.outcome === 'never' ? null : Date.now() + WEBHOOK_DELAY_MS;
  return null;
});

route('GET', '/offers', () => [
  {
    id: 'o1',
    kind: 'coupon',
    code: 'FIRST50',
    title: '₹50 off your first booking',
    description: 'New users only. Min order ₹25.',
  },
  {
    id: 'o2',
    kind: 'bank',
    code: null,
    title: 'Up to ₹30 cashback on UPI',
    description: 'Pay with any UPI app. Cashback within 7 days.',
  },
  {
    id: 'o3',
    kind: 'bank',
    code: null,
    title: '10% off with HDFC credit cards',
    description: 'Up to ₹50. Once per user per month.',
  },
]);
