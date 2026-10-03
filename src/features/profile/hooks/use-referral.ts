import { useQuery } from '@tanstack/react-query';

import { api, queryKeys } from '@/api';
import { useSessionStore } from '@/stores';

/** H5 referral code, tier and earnings (CD-066). */
export function useReferral() {
  const isUser = useSessionStore((s) => s.status === 'authenticated');
  return useQuery({ queryKey: queryKeys.referral, queryFn: api.referral.get, enabled: isUser });
}
