// Every TanStack Query key in one place, so invalidation (after a payment, a push, logout)
// can target exactly the right data. Stale times per key follow the Frontend Spec table.

export const queryKeys = {
  config: ['config'] as const,
  home: (addressId: string | undefined) => ['home', addressId ?? 'none'] as const,
  service: (slug: string) => ['service', slug] as const,
  geoSearch: (q: string) => ['geo', 'search', q] as const,
  addresses: ['addresses'] as const,
  me: ['me'] as const,
  /** Keyed by the exact cart input, so any change re-quotes and old quotes are reused on undo. */
  cartQuote: (input: object) => ['cart', 'quote', input] as const,
  slots: (hubId: string, date: string, durationMin: number) => ['slots', hubId, date, durationMin] as const,
  payment: (id: string) => ['payment', id] as const,
  offers: ['offers'] as const,
  recurringPlans: ['recurring-plans'] as const,
  referral: ['referral'] as const,
  wallet: ['wallet'] as const,
  walletTransactions: ['wallet', 'transactions'] as const,
  pass: {
    all: ['pass'] as const,
    offer: ['pass', 'offer'] as const,
    mine: ['pass', 'me'] as const,
  },
  bookings: {
    all: ['bookings'] as const,
    list: (status: 'upcoming' | 'past') => ['bookings', 'list', status] as const,
    detail: (id: string) => ['bookings', 'detail', id] as const,
  },
};

export const staleTimes = {
  config: 60 * 60_000,
  home: 5 * 60_000,
  service: 30 * 60_000,
  cart: 0,
  slots: 30_000,
  wallet: 30_000,
  bookings: 30_000,
} as const;
