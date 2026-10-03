import { request } from '../client';
import type { BookingCancellation, BookingDetail, BookingSummary, CursorPage } from '../types';

export const bookingsApi = {
  list: (status: 'upcoming' | 'past', cursor?: string) =>
    request<CursorPage<BookingSummary>>({
      method: 'GET',
      path: '/bookings',
      query: { status, cursor },
    }),
  detail: (id: string) =>
    request<BookingDetail>({ method: 'GET', path: `/bookings/${encodeURIComponent(id)}` }),
  /** Moves a scheduled/recurring booking to another slot of the same length. Free; no money moves. */
  reschedule: (id: string, slotStart: string, idempotencyKey: string) =>
    request<BookingSummary>({
      method: 'POST',
      path: `/bookings/${encodeURIComponent(id)}/reschedule`,
      body: { slotStart },
      idempotencyKey,
    }),
  /** Cancels with the published tiers; the refund goes to ChoreDash Money. One key per tap. */
  cancel: (id: string, idempotencyKey: string) =>
    request<BookingCancellation>({
      method: 'POST',
      path: `/bookings/${encodeURIComponent(id)}/cancel`,
      idempotencyKey,
    }),
};
