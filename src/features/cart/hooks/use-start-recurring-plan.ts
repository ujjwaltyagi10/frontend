import { useMutation, useQueryClient } from '@tanstack/react-query';
import { router } from 'expo-router';
import { useRef } from 'react';

import { api, queryKeys } from '@/api';
import { toast } from '@/components/ui';
import { track } from '@/lib/analytics';
import { useErrorMessage } from '@/lib/i18n';
import { newIdempotencyKey } from '@/lib/ids';
import { useCartDraftStore } from '@/stores';

/**
 * Start weekly plan (CD-041): turns the recurring-mode quote on screen into a plan. No payment
 * screen — every visit is paid from ChoreDash Money. One Idempotency-Key per quote, like Pay.
 * On success the cart is cleared and Bookings shows the plan.
 */
export function useStartRecurringPlan() {
  const keys = useRef(new Map<string, string>());
  const qc = useQueryClient();
  const clear = useCartDraftStore((s) => s.clear);
  const errorMessage = useErrorMessage();

  return useMutation({
    mutationFn: (quoteId: string) => {
      if (!keys.current.has(quoteId)) keys.current.set(quoteId, newIdempotencyKey());
      return api.recurring.create(quoteId, keys.current.get(quoteId)!);
    },
    onSuccess: (plan) => {
      track('recurring_plan_started', { days: plan.daysOfWeek.length, amount: plan.perVisitPaise });
      clear();
      // Starting can book the first visit right away (within 48 h) and spend from the wallet.
      void qc.invalidateQueries({ queryKey: queryKeys.recurringPlans });
      void qc.invalidateQueries({ queryKey: queryKeys.bookings.all });
      void qc.invalidateQueries({ queryKey: queryKeys.wallet });
      router.dismissAll();
      router.navigate('/bookings');
    },
    onError: (e) => toast.error(errorMessage(e)),
  });
}
