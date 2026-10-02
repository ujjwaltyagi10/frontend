// Query hooks for data every feature reads. Feature-specific hooks live in the feature.
import { useQuery } from '@tanstack/react-query';

import { configApi } from './endpoints/config';
import { queryKeys, staleTimes } from './query-keys';

/** GET /config — feature flags, min version, legal links. Cached for an hour and on disk. */
export function useAppConfig() {
  return useQuery({
    queryKey: queryKeys.config,
    queryFn: configApi.get,
    staleTime: staleTimes.config,
    meta: { persist: true },
  });
}

/** True only when the flag is explicitly on, so unknown flags stay off. */
export function useFeatureFlag(flag: string): boolean {
  return useAppConfig().data?.featureFlags[flag] === true;
}
