import { useQuery } from '@tanstack/react-query';

import { api, queryKeys } from '@/api';
import { staleTimes } from '@/api/query-keys';
import { useLocationStore } from '@/stores';

/** GET /home for the selected address. Persisted so Home renders instantly on cold start (B5). */
export function useHome() {
  const location = useLocationStore((s) => s.location);
  const addressId = location?.addressId ?? undefined;
  return useQuery({
    queryKey: queryKeys.home(addressId ?? `${location?.lat},${location?.lng}`),
    queryFn: () => api.catalog.home({ addressId, lat: location?.lat, lng: location?.lng }),
    staleTime: staleTimes.home,
    meta: { persist: true },
  });
}
