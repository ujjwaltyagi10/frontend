// Mock cart quotes and slots. Rules chosen so every UI state is easy to reach:
//  • Instant is unavailable outside 07:00–21:00 IST (OUTSIDE_HOURS) or above 3 hours total (LARGE_ORDER).
//  • The day after tomorrow has no slots at all (D1 empty state).
//  • Coupon FIRST50 gives ₹50 off; any other code is invalid.
// Prices follow the backend's pricing.BuildQuote: fees 5% of (items − discount), rounded half up.
import type { BookingMode, CartInput, CartQuote, QuoteLine, Slot } from '@/api/types';
import { istDateKey, istToUtcIso } from '@/lib/format/date';

import { db } from '../db';
import { serviceDetails } from '../fixtures/catalog';
import { addresses } from '../fixtures/geo';
import { isServed } from '../fixtures/serviceability';
import { MockHttpError, route } from '../router';

const OPEN_HOUR = 7; // service hours are an open question (Q-07)
const CLOSE_HOUR = 21;
const LARGE_ORDER_MIN = 180; // threshold undecided (Q-14)
const FEE_BPS = 500;

const istHourNow = () => (new Date().getUTCHours() + 5.5) % 24;

function priceLine(slug: string, durationMin: number): QuoteLine {
  const s = serviceDetails[slug];
  if (!s) throw new MockHttpError(422, 'VALIDATION_FAILED', `Unknown service ${slug}`);
  const exact = s.durations.find((d) => d.durationMin === durationMin);
  const base = s.durations[0];
  const blocks = durationMin / base.durationMin;
  return {
    serviceSlug: slug,
    name: s.name,
    imageUrl: s.imageUrl,
    durationMin,
    pricePaise: exact?.pricePaise ?? Math.round(base.pricePaise * blocks),
    mrpPaise: exact?.mrpPaise ?? (base.mrpPaise === null ? null : Math.round(base.mrpPaise * blocks)),
  };
}

function nextOpenSlot(): string {
  const now = new Date();
  const hour = istHourNow();
  const today = istDateKey(now);
  if (hour < OPEN_HOUR) return istToUtcIso(today, `0${OPEN_HOUR}:00`.slice(-5));
  if (hour >= CLOSE_HOUR - 1) return istToUtcIso(istDateKey(now, 1), `0${OPEN_HOUR}:00`.slice(-5));
  const next = Math.ceil(hour + 1);
  return istToUtcIso(today, `${String(next).padStart(2, '0')}:00`);
}

/** Like the backend: a saved address wins; an unknown one is 404; otherwise the raw point. */
function servedFor(input: CartInput): boolean {
  if (input.addressId) {
    const a = addresses.find((x) => x.id === input.addressId);
    if (!a) throw new MockHttpError(404, 'NOT_FOUND', 'Address not found');
    return isServed(a.lat);
  }
  return !!input.location && isServed(input.location.lat);
}

function quote(input: CartInput): CartQuote {
  const lines = input.items.map((i) => priceLine(i.serviceSlug, i.durationMin));
  const itemTotal = lines.reduce((sum, l) => sum + l.pricePaise, 0);
  const mrpTotal = lines.reduce((sum, l) => sum + Math.max(l.mrpPaise ?? l.pricePaise, l.pricePaise), 0);

  const code = input.couponCode?.trim().toUpperCase() || null;
  const couponValid = code === 'FIRST50';
  const discount = couponValid ? Math.min(5_000, itemTotal) : 0;
  const taxable = itemTotal - discount;
  const fees = Math.floor((taxable * FEE_BPS + 5_000) / 10_000);

  const totalMin = input.items.reduce((sum, i) => sum + i.durationMin, 0);
  const hour = istHourNow();
  const reason =
    totalMin > LARGE_ORDER_MIN
      ? 'LARGE_ORDER'
      : hour < OPEN_HOUR || hour >= CLOSE_HOUR
        ? 'OUTSIDE_HOURS'
        : null;

  return {
    quoteId: `q_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`,
    mode: input.mode as BookingMode,
    lines,
    itemTotalPaise: itemTotal,
    mrpTotalPaise: mrpTotal,
    discountPaise: discount,
    feesPaise: fees,
    totalPaise: taxable + fees,
    savingsPaise: mrpTotal - itemTotal + discount,
    coupon: code
      ? { code, valid: couponValid, message: couponValid ? '₹50 off applied' : 'This coupon is not valid' }
      : null,
    instant: { available: reason === null, reason, nextAvailableAt: reason ? nextOpenSlot() : null },
    serviceable: servedFor(input),
  };
}

route('PUT', '/cart', ({ body }) => {
  const q = quote(body as CartInput);
  db.quotes.set(q.quoteId, { input: body as CartInput, quote: q });
  return q;
});

route('GET', '/slots', ({ query }) => {
  const date = String(query?.date);
  const duration = Number(query?.duration) || 30;
  const today = istDateKey();
  if (date === istDateKey(new Date(), 2)) return { date, slots: [] }; // D1 "No slots available"

  const slots: Slot[] = [];
  const lastStartMin = CLOSE_HOUR * 60 - duration;
  for (let m = OPEN_HOUR * 60; m <= lastStartMin; m += 30) {
    const hhmm = `${String(Math.floor(m / 60)).padStart(2, '0')}:${String(m % 60).padStart(2, '0')}`;
    const start = istToUtcIso(date, hhmm);
    const past = date === today && new Date(start).getTime() < Date.now() + 60 * 60_000;
    if (past) continue;
    // Deterministic "busy" pattern so the grid looks real and doesn't flicker on refetch.
    const busy = (m / 30 + date.charCodeAt(9)) % 4 === 0;
    slots.push({ start, available: !busy });
  }
  return { date, slots };
});
