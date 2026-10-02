import { useQuery } from '@tanstack/react-query';

import { api, queryKeys } from '@/api';

export function usePassOffer() {
  return useQuery({ queryKey: queryKeys.pass.offer, queryFn: api.pass.offer, staleTime: 30 * 60_000 });
}

export { useMyPass } from '@/hooks';
