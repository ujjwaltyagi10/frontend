// Mock weekly plans (CD-041). Rules from the PRD, as the backend should apply them:
//  • Only from a recurring-mode quote with a plan (days + time) and a saved address.
//  • Paid only from ChoreDash Money: starting needs a balance that covers one visit
//    (INSUFFICIENT_BALANCE otherwise). Each visit is paid from the wallet 48 h before and becomes
//    a confirmed booking; a visit the balance can't cover is skipped (see bookDueVisits).
//  • Stopping keeps the plan (status 'stopped') so history still reads right.
import type { Booking, CartQuote, RecurringPlan } from '@/api/types';
import { istDateKey, istToUtcIso } from '@/lib/format/date';

import { db, newId, once } from '../db';
import { addresses } from '../fixtures/geo';
import { mapPart, persisted } from '../persist';
import { MockHttpError, requireUser, route } from '../router';
import { spendForVisit, walletTotal } from './wallet';

const plans = new Map<string, RecurringPlan>();
/** The quote each plan was made from — what every visit books. */
const planQuotes = new Map<string, CartQuote>();
persisted('recurringPlans', mapPart(plans));
persisted('recurringPlanQuotes', mapPart(planQuotes));

const HOUR = 3_600_000;

/** First chosen weekday at the plan's time that is still at least 12 h away (the skip cut-off). */
function nextVisit(daysOfWeek: number[], slotTime: string, now = new Date()): string {
  for (let add = 0; add < 22; add++) {
    const day = istDateKey(now, add);
    const weekday = new Date(`${day}T00:00:00Z`).getUTCDay();
    const at = istToUtcIso(day, slotTime);
    if (daysOfWeek.includes(weekday) && new Date(at).getTime() - now.getTime() >= 12 * HOUR) return at;
  }
  throw new MockHttpError(422, 'VALIDATION_FAILED', 'Pick at least one day');
}

/**
 * The 48 h rule, run whenever plans or bookings are read: a visit within 48 h is paid from the
 * wallet and becomes a confirmed booking; if the balance is short it's skipped. Either way the plan
 * moves on to its following visit. (The backend does this on a schedule.)
 */
export function bookDueVisits(now = new Date()) {
  for (const plan of plans.values()) {
    const quote = planQuotes.get(plan.id) ?? quoteFromPlan(plan);
    while (plan.status === 'active' && plan.nextVisitAt) {
      const at = Date.parse(plan.nextVisitAt);
      if (at - now.getTime() > 48 * HOUR) break;
      const names = plan.items.map((i) => i.name);
      // A visit already past is skipped, never booked after the fact.
      if (at > now.getTime() && spendForVisit(plan.perVisitPaise, `Weekly plan · ${names.join(', ')}`)) {
        const booking: Booking = {
          id: newId('bk'),
          mode: 'recurring',
          status: 'confirmed',
          slotStart: plan.nextVisitAt,
          durationMin: plan.items.reduce((sum, i) => sum + i.durationMin, 0),
          serviceNames: names,
          addressLine: plan.addressLine,
          totalPaise: plan.perVisitPaise,
          holdExpiresAt: null,
        };
        db.bookings.set(booking.id, booking);
        db.bookingMeta.set(booking.id, {
          quote: { ...quote, mode: 'recurring' },
          createdAt: now.toISOString(),
          confirmedAt: now.toISOString(),
        });
      }
      // Next occurrence strictly after this visit (+1 min skips the same slot).
      plan.nextVisitAt = nextVisit(plan.daysOfWeek, plan.slotTime, new Date(at + 60_000 - 12 * HOUR));
    }
  }
}

/** For plans saved before quotes were kept: the plan's own items and per-visit price. */
function quoteFromPlan(plan: RecurringPlan): CartQuote {
  const each = Math.floor(plan.perVisitPaise / Math.max(plan.items.length, 1));
  return {
    quoteId: `q_plan_${plan.id}`,
    mode: 'recurring',
    lines: plan.items.map((i) => ({ ...i, pricePaise: each, mrpPaise: null })),
    itemTotalPaise: plan.perVisitPaise,
    mrpTotalPaise: plan.perVisitPaise,
    discountPaise: 0,
    feesPaise: 0,
    totalPaise: plan.perVisitPaise,
    savingsPaise: 0,
    coupon: null,
    instant: { available: false, reason: null, nextAvailableAt: null },
    serviceable: true,
  };
}

route('GET', '/recurring-plans', (ctx) => {
  requireUser(ctx);
  bookDueVisits();
  return [...plans.values()].sort((a, b) => b.createdAt.localeCompare(a.createdAt));
});

route('POST', '/recurring-plans', (ctx) => {
  requireUser(ctx);
  return once(ctx.headers?.['Idempotency-Key'], () => {
    const saved = db.quotes.get(String(ctx.body?.quoteId));
    if (!saved) throw new MockHttpError(404, 'NOT_FOUND', 'Quote expired — refresh the cart');
    const { input, quote } = saved;
    const plan = input.recurrence;
    if (input.mode !== 'recurring' || !plan || plan.daysOfWeek.length === 0)
      throw new MockHttpError(422, 'VALIDATION_FAILED', 'Choose days and a time');
    const address = addresses.find((a) => a.id === input.addressId);
    if (!address) throw new MockHttpError(422, 'VALIDATION_FAILED', 'Add the flat / house number');
    if (walletTotal() < quote.totalPaise) throw new MockHttpError(409, 'INSUFFICIENT_BALANCE');

    const created: RecurringPlan = {
      id: newId('plan'),
      status: 'active',
      daysOfWeek: [...plan.daysOfWeek].sort((a, b) => a - b),
      slotTime: plan.slotTime,
      items: quote.lines.map((l) => ({
        serviceSlug: l.serviceSlug,
        name: l.name,
        imageUrl: l.imageUrl,
        durationMin: l.durationMin,
      })),
      perVisitPaise: quote.totalPaise,
      nextVisitAt: nextVisit(plan.daysOfWeek, plan.slotTime),
      addressLine: [address.flatNo, address.line1].filter(Boolean).join(', '),
      createdAt: new Date().toISOString(),
    };
    plans.set(created.id, created);
    planQuotes.set(created.id, quote);
    bookDueVisits();
    return plans.get(created.id)!;
  });
});

route('DELETE', '/recurring-plans/:id', (ctx) => {
  requireUser(ctx);
  const plan = plans.get(ctx.params.id);
  if (!plan) throw new MockHttpError(404, 'NOT_FOUND');
  const stopped: RecurringPlan = { ...plan, status: 'stopped', nextVisitAt: null };
  plans.set(plan.id, stopped);
  return stopped;
});
