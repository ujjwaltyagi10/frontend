import { request } from '../client';
import type { ReferralSummary } from '../types';

export const referralApi = {
  get: () => request<ReferralSummary>({ method: 'GET', path: '/referral' }),
};
