// State shared by mock handlers, so flows connect: a quote becomes a booking, a paid booking
// shows up in My Bookings. Kept in memory and saved to device storage (persist.ts).
import type { Booking, CartInput, CartQuote, Me, Payment } from '@/api/types';

import { mapPart, persisted } from './persist';

export const db = {
  quotes: new Map<string, { input: CartInput; quote: CartQuote }>(),
  bookings: new Map<string, Booking>(),
  payments: new Map<
    string,
    Payment & { resolveAt: number | null; outcome: 'success' | 'failure' | 'never' | null }
  >(),
  /** Extra booking facts the detail screen needs: the quote it was made from and status times. */
  bookingMeta: new Map<
    string,
    { quote: CartQuote; createdAt: string; confirmedAt: string | null; cancelledAt?: string }
  >(),
  /** The signed-in mock customer (set on OTP verify). */
  me: null as Me | null,
  /** Idempotency-Key → first response, like the real backend's replay. */
  idempotent: new Map<string, unknown>(),
};

export const newId = (prefix: string) =>
  `${prefix}_${Date.now().toString(36)}${Math.random().toString(36).slice(2, 6)}`;

/** Replays the first result for a repeated Idempotency-Key. */
export function once<T>(key: string | undefined, create: () => T): T {
  if (!key) return create();
  if (!db.idempotent.has(key)) db.idempotent.set(key, create());
  return db.idempotent.get(key) as T;
}

persisted('quotes', mapPart(db.quotes));
persisted('bookings', mapPart(db.bookings));
persisted('payments', mapPart(db.payments));
persisted('bookingMeta', mapPart(db.bookingMeta));
persisted('idempotent', mapPart(db.idempotent));
persisted('me', {
  save: () => db.me,
  load: (v) => (db.me = v as Me | null),
  reset: () => (db.me = null),
});
