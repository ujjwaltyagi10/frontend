import { useQuery } from '@tanstack/react-query';

import { api, queryKeys } from '@/api';
import { useSessionStore } from '@/stores';

/** The user's active Pass (null when none). Guests never have one. Used by Pass (E1) and Profile (H1). */
export function useMyPass() {
  const isUser = useSessionStore((s) => s.status === 'authenticated');
  return useQuery({ queryKey: queryKeys.pass.mine, queryFn: api.pass.mine, enabled: isUser });
}
