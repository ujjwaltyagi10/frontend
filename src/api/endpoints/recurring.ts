import { request } from '../client';
import type { RecurringPlan } from '../types';

/** Weekly plans (CD-041). Starting one needs ChoreDash Money for the first visit (INSUFFICIENT_BALANCE). */
export const recurringApi = {
  list: () => request<RecurringPlan[]>({ method: 'GET', path: '/recurring-plans' }),
  /** From a recurring-mode cart quote; one key per tap, reused on retry. */
  create: (quoteId: string, idempotencyKey: string) =>
    request<RecurringPlan>({ method: 'POST', path: '/recurring-plans', body: { quoteId }, idempotencyKey }),
  /** Stops future visits; visits already held or booked are kept. */
  stop: (id: string) => request<RecurringPlan>({ method: 'DELETE', path: `/recurring-plans/${id}` }),
};
