import { useQuery } from '@tanstack/react-query';

import { api, queryKeys, staleTimes } from '@/api';

/** Duration options for a service (D1 duration chips when scheduling from Home). Shares the service cache. */
export function useServiceDurations(slug: string, enabled: boolean) {
  return useQuery({
    queryKey: queryKeys.service(slug),
    queryFn: () => api.catalog.service(slug),
    staleTime: staleTimes.service,
    enabled,
    select: (s) => s.durations,
  });
}
