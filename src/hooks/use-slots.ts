import { useQuery } from '@tanstack/react-query';

import { api, queryKeys, staleTimes } from '@/api';

/** Free slots for a hub, day and length. Used by Schedule (D1), weekly plans and Reschedule. */
export function useSlots(hubId: string | null, date: string, durationMin: number) {
  return useQuery({
    queryKey: queryKeys.slots(hubId ?? 'none', date, durationMin),
    queryFn: () => api.cart.slots(hubId!, date, durationMin),
    enabled: !!hubId && durationMin > 0,
    staleTime: staleTimes.slots,
  });
}
