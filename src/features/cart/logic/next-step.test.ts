import type { CartQuote } from '@/api/types';

import { getNextStep } from './next-step';

const quote = (over: Partial<CartQuote> = {}): CartQuote => ({
  quoteId: 'q',
  mode: 'instant',
  lines: [],
  itemTotalPaise: 2500,
  mrpTotalPaise: 12500,
  discountPaise: 0,
  feesPaise: 125,
  totalPaise: 2625,
  savingsPaise: 10000,
  coupon: null,
  instant: { available: true, reason: null, nextAvailableAt: null },
  serviceable: true,
  ...over,
});

const ready = {
  itemCount: 1,
  mode: 'instant' as const,
  quote: quote(),
  quoteIsStale: false,
  slotStart: null,
  hasRecurrence: false,
  isGuest: false,
  addressId: 'a1',
};

describe('getNextStep', () => {
  it('is PAY when everything is in place', () => expect(getNextStep(ready)).toBe('PAY'));
  it('needs items first', () => expect(getNextStep({ ...ready, itemCount: 0 })).toBe('EMPTY'));
  it('waits for a fresh quote', () => {
    expect(getNextStep({ ...ready, quote: undefined })).toBe('QUOTING');
    expect(getNextStep({ ...ready, quoteIsStale: true })).toBe('QUOTING');
  });
  it('blocks unserved locations', () =>
    expect(getNextStep({ ...ready, quote: quote({ serviceable: false }) })).toBe('NOT_SERVICEABLE'));
  it('steers to scheduling when instant is unavailable', () => {
    const q = quote({ instant: { available: false, reason: 'LARGE_ORDER', nextAvailableAt: null } });
    expect(getNextStep({ ...ready, quote: q })).toBe('SCHEDULE_INSTEAD');
    // …but not once the user is already on Scheduled
    expect(getNextStep({ ...ready, quote: q, mode: 'scheduled', slotStart: 'x' })).toBe('PAY');
  });
  it('needs a slot for scheduled', () =>
    expect(getNextStep({ ...ready, mode: 'scheduled' })).toBe('PICK_SLOT'));
  it('needs a plan for recurring', () =>
    expect(getNextStep({ ...ready, mode: 'recurring' })).toBe('SET_UP_RECURRING'));
  it('asks guests to log in before asking for an address', () =>
    expect(getNextStep({ ...ready, isGuest: true, addressId: null })).toBe('LOGIN'));
  it('needs a saved address last', () =>
    expect(getNextStep({ ...ready, addressId: null })).toBe('ADD_ADDRESS'));
});
