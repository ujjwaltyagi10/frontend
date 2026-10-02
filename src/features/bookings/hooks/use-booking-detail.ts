import { useQuery } from '@tanstack/react-query';

import { api, queryKeys, staleTimes, type BookingStatus } from '@/api';

const ACTIVE: BookingStatus[] = ['confirmed', 'assigned', 'in_progress'];
const ACTIVE_REFRESH_MS = 30_000;

/** GET /bookings/{id}; refreshes every 30 s while the visit is still to come or under way. */
export function useBookingDetail(id: string) {
  return useQuery({
    queryKey: queryKeys.bookings.detail(id),
    queryFn: () => api.bookings.detail(id),
    staleTime: staleTimes.bookings,
    refetchInterval: (q) =>
      q.state.data && ACTIVE.includes(q.state.data.status) ? ACTIVE_REFRESH_MS : false,
  });
}
