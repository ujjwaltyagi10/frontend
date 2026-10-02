import { useQuery } from '@tanstack/react-query';
import { useEffect, useState } from 'react';

import { api, queryKeys, type PaymentCreateRequest } from '@/api';
import { PAYMENT_POLL_INTERVAL_MS, PAYMENT_POLL_TIMEOUT_MS } from '@/config/constants';
import { newIdempotencyKey } from '@/lib/ids';

/**
 * Creates the payment intent when F4 opens, so the header can show the server's amount.
 * One Idempotency-Key per screen visit: retries and re-renders get the same payment back.
 */
export function usePaymentIntent(target: PaymentCreateRequest | null) {
  const [key] = useState(newIdempotencyKey);
  return useQuery({
    queryKey: ['payment-intent', key],
    queryFn: () => api.checkout.createPayment(target!, key),
    enabled: !!target,
    staleTime: Infinity,
    gcTime: 0,
  });
}

const TERMINAL = new Set(['succeeded', 'failed', 'cancelled']);

/**
 * GET /payments/{id}. From `pollSince` (when the user returns from the gateway) it refetches every
 * 2 s for up to 60 s (Frontend Spec → F4); after that `timedOut` turns true and polling stops.
 */
export function usePaymentStatus(paymentId: string | undefined, pollSince: number | null) {
  // Which polling run has timed out; a new `pollSince` starts fresh without resetting state.
  const [timedOutRun, setTimedOutRun] = useState<number | null>(null);
  const timedOut = pollSince !== null && timedOutRun === pollSince;

  useEffect(() => {
    if (pollSince === null) return;
    const id = setTimeout(
      () => setTimedOutRun(pollSince),
      Math.max(0, pollSince + PAYMENT_POLL_TIMEOUT_MS - Date.now()),
    );
    return () => clearTimeout(id);
  }, [pollSince]);

  const query = useQuery({
    queryKey: queryKeys.payment(paymentId ?? 'none'),
    queryFn: () => api.checkout.getPayment(paymentId!),
    enabled: !!paymentId,
    refetchInterval: (q) => {
      const status = q.state.data?.status;
      if (pollSince === null || timedOut || (status && TERMINAL.has(status))) return false;
      return PAYMENT_POLL_INTERVAL_MS;
    },
  });
  const isFinal = !!query.data && TERMINAL.has(query.data.status);
  return { ...query, isFinal, timedOut: timedOut && !isFinal };
}
