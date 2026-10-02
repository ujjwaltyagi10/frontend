import { useQuery } from '@tanstack/react-query';

import { api, queryKeys } from '@/api';
import { staleTimes } from '@/api/query-keys';

export function useService(slug: string) {
  return useQuery({
    queryKey: queryKeys.service(slug),
    queryFn: () => api.catalog.service(slug),
    staleTime: staleTimes.service,
    meta: { persist: true },
  });
}
