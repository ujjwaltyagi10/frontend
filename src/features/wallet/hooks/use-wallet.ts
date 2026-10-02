import { useInfiniteQuery, useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useRef } from 'react';

import { api, queryKeys, staleTimes } from '@/api';
import { newIdempotencyKey } from '@/lib/ids';

export function useWallet() {
  return useQuery({ queryKey: queryKeys.wallet, queryFn: api.wallet.get, staleTime: staleTimes.wallet });
}

const PENDING_REFRESH_MS = 10_000;

/** F7 history, paged by cursor. Refreshes every 10 s while any row is still pending. */
export function useWalletTransactions() {
  return useInfiniteQuery({
    queryKey: queryKeys.walletTransactions,
    queryFn: ({ pageParam }) => api.wallet.transactions(pageParam),
    initialPageParam: undefined as string | undefined,
    getNextPageParam: (last) => last.nextCursor ?? undefined,
    refetchInterval: (q) =>
      q.state.data?.pages.some((p) => p.items.some((t) => t.status === 'pending'))
        ? PENDING_REFRESH_MS
        : false,
  });
}

/** F3. One Idempotency-Key per code: retrying the same code can't credit twice; a new code gets a new key. */
export function useRedeemGiftCard() {
  const qc = useQueryClient();
  const keys = useRef(new Map<string, string>());
  return useMutation({
    mutationFn: (code: string) => {
      if (!keys.current.has(code)) keys.current.set(code, newIdempotencyKey());
      return api.wallet.redeemGiftCard(code, keys.current.get(code)!);
    },
    onSuccess: (r) => {
      qc.setQueryData(queryKeys.wallet, r.wallet);
      void qc.invalidateQueries({ queryKey: queryKeys.walletTransactions });
    },
  });
}
