// Mock referral (H5–H6). Rules from the PRD: the friend gets ₹50 off the first order; the referrer
// earns per completed referral — ₹100 (1–5, Champ), ₹150 (6–9, Star), ₹200 (10+, Legend) — only
// after the friend's first completed, paid booking. Fixture: 2 completed, 1 pending.
import type { ReferralSummary, ReferralTier } from '@/api/types';

import { once } from '../db';
import { persisted, setPart } from '../persist';
import { MockHttpError, requireUser, route } from '../router';
import { creditReferralReward, summary } from './wallet';
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

/** Phones that already redeemed a friend's code — once per account. */
const redeemedBy = new Set<string>();
persisted('referralRedeemed', setPart(redeemedBy));

const FRIEND_REWARD = 5_000;

/**
 * A new user enters a friend's code right after signup: ₹50 into ChoreDash Money (rewards).
 * The mock has one user at a time, so any well-formed code (letters + 3 digits) that isn't
 * your own counts as a real friend's; the backend checks it against real accounts.
 */
route('POST', '/referral/redeem', (ctx) => {
  requireUser(ctx);
  return once(ctx.headers['Idempotency-Key'], () => {
    const me = currentUser(ctx);
    const code = String(ctx.body?.code ?? '')
      .trim()
      .toUpperCase()
      .replace(/\s+/g, '');
    if (!/^[A-Z]{1,6}\d{3}$/.test(code) || code === referralCodeFor(me))
      throw new MockHttpError(409, 'REFERRAL_INVALID');
    // The mock's bookings aren't kept per user, so "new account" = this number never redeemed
    // before (the backend also refuses accounts that already completed a booking).
    if (redeemedBy.has(me.phone)) throw new MockHttpError(409, 'REFERRAL_NOT_ELIGIBLE');
    redeemedBy.add(me.phone);
    creditReferralReward(FRIEND_REWARD);
    return { creditedPaise: FRIEND_REWARD, wallet: summary() };
  });
});
