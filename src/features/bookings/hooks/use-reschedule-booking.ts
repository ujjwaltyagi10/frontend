import { useMutation, useQueryClient } from '@tanstack/react-query';
import { useState } from 'react';

import { api, queryKeys } from '@/api';
import { newIdempotencyKey } from '@/lib/ids';

/** Move a booking to another slot (free). One key per screen visit; the server checks the cut-off. */
export function useRescheduleBooking(bookingId: string) {
  const [key] = useState(newIdempotencyKey);
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (slotStart: string) => api.bookings.reschedule(bookingId, slotStart, key),
    onSuccess: () => qc.invalidateQueries({ queryKey: queryKeys.bookings.all }),
  });
}
