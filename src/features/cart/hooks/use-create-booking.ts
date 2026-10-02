import { useMutation } from '@tanstack/react-query';
import { router } from 'expo-router';
import { useRef } from 'react';

import { api, isApiError } from '@/api';
import { toast } from '@/components/ui';
import { useErrorMessage } from '@/lib/i18n';
import { newIdempotencyKey } from '@/lib/ids';
import { useCartDraftStore } from '@/stores';

/**
 * Pay (D3): books exactly the quote on screen, then opens Payment options (F4).
 * The Idempotency-Key is tied to the quote: tapping Pay twice, or retrying after a network
 * error, can't create a second booking — a changed cart gets a new key.
 */
export function useCreateBooking() {
  const keys = useRef(new Map<string, string>());
  const errorMessage = useErrorMessage();
  const setSlot = useCartDraftStore((s) => s.setSlot);
  const setMode = useCartDraftStore((s) => s.setMode);

  return useMutation({
    mutationFn: (quoteId: string) => {
      if (!keys.current.has(quoteId)) keys.current.set(quoteId, newIdempotencyKey());
      return api.checkout.createBooking({ quoteId }, keys.current.get(quoteId)!);
    },
    onSuccess: (booking) =>
      router.push({ pathname: '/checkout', params: { purpose: 'booking', bookingId: booking.id } }),
    onError: (e) => {
      toast.error(errorMessage(e));
      if (!isApiError(e)) return;
      if (e.code === 'SLOT_UNAVAILABLE') setSlot(null); // pick another
      if (e.code === 'LARGE_ORDER_SCHEDULE_ONLY') setMode('scheduled');
    },
  });
}
