import { useMutation, useQueryClient } from '@tanstack/react-query';
import { useState } from 'react';

import { api, queryKeys } from '@/api';
import { track } from '@/lib/analytics';
import { newIdempotencyKey } from '@/lib/ids';

/**
 * Cancel a booking (CD-061). The server applies the tiers and credits the refund to ChoreDash
 * Money; one key per screen visit so a retry after a network error can't refund twice.
 */
export function useCancelBooking() {
  const [key] = useState(newIdempotencyKey);
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (bookingId: string) => api.bookings.cancel(bookingId, key),
    onSuccess: (r) => {
      track('booking_cancelled', { fee_percent: r.cancellationFeePercent, refund: r.refundPaise });
      void qc.invalidateQueries({ queryKey: queryKeys.bookings.all });
      void qc.invalidateQueries({ queryKey: queryKeys.wallet });
      void qc.invalidateQueries({ queryKey: queryKeys.pass.all });
    },
  });
}
