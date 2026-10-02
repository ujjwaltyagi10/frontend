import { request } from '../client';
import type { BookingDetail, BookingSummary, CursorPage } from '../types';

export const bookingsApi = {
  list: (status: 'upcoming' | 'past', cursor?: string) =>
    request<CursorPage<BookingSummary>>({
      method: 'GET',
      path: '/bookings',
      query: { status, cursor },
    }),
  detail: (id: string) =>
    request<BookingDetail>({ method: 'GET', path: `/bookings/${encodeURIComponent(id)}` }),
};
