import { useQuery } from '@tanstack/react-query';

import { api, queryKeys, staleTimes } from '@/api';
import { useSessionStore } from '@/stores';

/** ChoreDash Money balance. Used by Money (F1) and weekly plans, which are paid only from it. */
export function useWalletSummary() {
  const isUser = useSessionStore((s) => s.status === 'authenticated');
  return useQuery({
    queryKey: queryKeys.wallet,
    queryFn: api.wallet.get,
    staleTime: staleTimes.wallet,
    enabled: isUser,
  });
}
