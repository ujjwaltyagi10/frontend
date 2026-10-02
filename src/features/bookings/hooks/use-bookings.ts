import { useQuery } from '@tanstack/react-query';

import { api, queryKeys } from '@/api';
import { staleTimes } from '@/api/query-keys';
import { useSessionStore } from '@/stores';

export function useBookings(status: 'upcoming' | 'past') {
  const isUser = useSessionStore((s) => s.status === 'authenticated');
  return useQuery({
    queryKey: queryKeys.bookings.list(status),
    queryFn: () => api.bookings.list(status),
    staleTime: staleTimes.bookings,
    enabled: isUser, // guests have no bookings; the screen shows a login prompt instead
    meta: { persist: true },
  });
}
