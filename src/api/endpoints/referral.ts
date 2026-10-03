import { request } from '../client';
import type { ReferralRedeemResponse, ReferralSummary } from '../types';

export const referralApi = {
  get: () => request<ReferralSummary>({ method: 'GET', path: '/referral' }),
  /** New accounts only, once. One key per tap so a retry can't credit twice. */
  redeem: (code: string, idempotencyKey: string) =>
    request<ReferralRedeemResponse>({
      method: 'POST',
      path: '/referral/redeem',
      body: { code },
      idempotencyKey,
    }),
};
