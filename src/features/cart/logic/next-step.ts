import type { BookingMode, CartQuote } from '@/api/types';

export type NextStep =
  | 'EMPTY' // nothing in the cart
  | 'QUOTING' // waiting for the server price
  | 'NOT_SERVICEABLE' // location isn't served (B6)
  | 'SCHEDULE_INSTEAD' // instant isn't possible right now (CT-4)
  | 'PICK_SLOT' // scheduled without a slot
  | 'SET_UP_RECURRING' // recurring without a weekly plan
  | 'LOGIN' // guest — login is required before paying (ON-9)
  | 'ADD_ADDRESS' // location isn't a saved address yet (flat no. etc.)
  | 'PAY';

type Input = {
  itemCount: number;
  mode: BookingMode;
  quote: CartQuote | undefined;
  quoteIsStale: boolean;
  slotStart: string | null;
  hasRecurrence: boolean;
  isGuest: boolean;
  addressId: string | null;
};

/**
 * The single next thing the user must do before paying (PRD CT-10). The footer button shows
 * it, so the user always knows what's missing — instead of Pronto's vague "Add address to proceed".
 * Order matters: fix the booking itself first, then who/where, then pay.
 */
export function getNextStep(i: Input): NextStep {
  if (i.itemCount === 0) return 'EMPTY';
  if (!i.quote || i.quoteIsStale) return 'QUOTING';
  if (!i.quote.serviceable) return 'NOT_SERVICEABLE';
  if (i.mode === 'instant' && !i.quote.instant.available) return 'SCHEDULE_INSTEAD';
  if (i.mode === 'scheduled' && !i.slotStart) return 'PICK_SLOT';
  if (i.mode === 'recurring' && !i.hasRecurrence) return 'SET_UP_RECURRING';
  if (i.isGuest) return 'LOGIN';
  if (!i.addressId) return 'ADD_ADDRESS';
  return 'PAY';
}
