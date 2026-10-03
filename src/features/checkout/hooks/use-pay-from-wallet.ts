import { useMutation, useQueryClient } from '@tanstack/react-query';
import { useState } from 'react';

import { api, queryKeys } from '@/api';
import { track } from '@/lib/analytics';
import { newIdempotencyKey } from '@/lib/ids';
import { useCartDraftStore } from '@/stores';

/**
 * PY-6 Quick Checkout (CD-055): pays the held booking from ChoreDash Money in one call — no
 * gateway, no polling; the server debits and confirms together. One key per payment-screen
 * visit, reused if the user taps again after a network error.
 */
export function usePayFromWallet() {
  const [key] = useState(newIdempotencyKey);
  const qc = useQueryClient();
  const clearCart = useCartDraftStore((s) => s.clear);

  return useMutation({
    mutationFn: (bookingId: string) => api.wallet.payBooking(bookingId, key),
    onSuccess: ({ booking, wallet }) => {
      qc.setQueryData(queryKeys.wallet, wallet);
      void qc.invalidateQueries({ queryKey: queryKeys.walletTransactions });
      void qc.invalidateQueries({ queryKey: queryKeys.bookings.all });
      void qc.invalidateQueries({ queryKey: queryKeys.pass.all });
      clearCart();
      track('payment_succeeded', { method: 'wallet', amount: booking.totalPaise });
      track('booking_confirmed', { mode: booking.mode, amount: booking.totalPaise });
    },
  });
}
