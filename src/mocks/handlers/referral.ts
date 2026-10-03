// Mock referral (H5–H6). Rules from the PRD: the friend gets ₹50 off the first order; the referrer
// earns per completed referral — ₹100 (1–5, Champ), ₹150 (6–9, Star), ₹200 (10+, Legend) — only
// after the friend's first completed, paid booking. Fixture: 2 completed, 1 pending.
import type { ReferralSummary, ReferralTier } from '@/api/types';

import { requireUser, route } from '../router';
import { me as currentUser } from './profile';

const TIERS: ReferralTier[] = [
  { id: 'champ', name: 'Champ', minReferrals: 1, maxReferrals: 5, rewardPaise: 10_000 },
  { id: 'star', name: 'Star', minReferrals: 6, maxReferrals: 9, rewardPaise: 15_000 },
  { id: 'legend', name: 'Legend', minReferrals: 10, maxReferrals: null, rewardPaise: 20_000 },
];
const COMPLETED = 2;
const PENDING = 1;

/** A user's own code: first name (≤ 6 letters, else CHORE) + last 3 digits of the phone. */
export function referralCodeFor(user: { firstName: string | null; phone: string }) {
  const base =
    (user.firstName ?? '')
      .replace(/[^a-z]/gi, '')
      .slice(0, 6)
      .toUpperCase() || 'CHORE';
  return `${base}${user.phone.slice(-3)}`;
}

route('GET', '/referral', (ctx) => {
  requireUser(ctx);
  const me = currentUser(ctx);
  const code = referralCodeFor(me);
  const tier = TIERS.find(
    (t) => COMPLETED >= t.minReferrals && (t.maxReferrals === null || COMPLETED <= t.maxReferrals),
  );
  const summary: ReferralSummary = {
    code,
    shareUrl: `https://choredash.app/app/referral?code=${code}`,
    friendDiscountPaise: 5_000,
    completedCount: COMPLETED,
    pendingCount: PENDING,
    earnedPaise: COMPLETED * (tier?.rewardPaise ?? 0),
    tiers: TIERS,
    currentTierId: tier?.id ?? null,
  };
  return summary;
});
