import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';

import { api, queryKeys } from '@/api';
import { useSessionStore } from '@/stores';

/** The user's weekly plans (CD-041). Shown in Bookings; started from the cart. */
export function useRecurringPlans() {
  const isUser = useSessionStore((s) => s.status === 'authenticated');
  return useQuery({ queryKey: queryKeys.recurringPlans, queryFn: api.recurring.list, enabled: isUser });
}

/** Stops a plan's future visits. */
export function useStopRecurringPlan() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => api.recurring.stop(id),
    onSuccess: () => qc.invalidateQueries({ queryKey: queryKeys.recurringPlans }),
  });
}
