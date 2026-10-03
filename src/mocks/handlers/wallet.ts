// Mock ChoreDash Money + Pass. Rules are Pronto's reference values (Q-11, Q-12):
// 5% promo bonus on top-ups ≥ ₹250; promo expires in 15 days, cash in 1 year; closed loop.
// Gift card CHOREDASH100 credits ₹100 cash; 5 wrong codes lock redemption for an hour.
import type { Pass, PassOffer, WalletSummary, WalletTransaction } from '@/api/types';

import { newId, once } from '../db';
import { persisted, setPart } from '../persist';
import { MockHttpError, requireUser, route } from '../router';

const DAY = 86_400_000;
const RULES = {
  minPaise: 100,
  maxPaise: 1_000_000,
  presetsPaise: [25_000, 50_000, 100_000],
  bonus: { minPaise: 25_000, bps: 500 },
};
const LOW_BALANCE_PAISE = 10_000;

const wallet = {
  cash: 0,
  promo: 0,
  tx: [] as (WalletTransaction & { paymentId?: string })[],
  giftCardFailures: 0,
  lockedUntil: 0,
};
const redeemedGiftCards = new Set<string>();
persisted('giftCards', setPart(redeemedGiftCards));
persisted('wallet', {
  save: () => wallet,
  load: (v) => Object.assign(wallet, v),
  reset: () => Object.assign(wallet, { cash: 0, promo: 0, tx: [], giftCardFailures: 0, lockedUntil: 0 }),
});

/** Spendable balance (cash + rewards), for weekly plans' first-visit check. */
export const walletTotal = () => wallet.cash + wallet.promo;

export const bonusFor = (amount: number) =>
  amount >= RULES.bonus.minPaise ? Math.round((amount * RULES.bonus.bps) / 10_000) : 0;

function summary(): WalletSummary {
  return {
    cashBalancePaise: wallet.cash,
    promoBalancePaise: wallet.promo,
    totalPaise: wallet.cash + wallet.promo,
    lowBalance: wallet.cash + wallet.promo < LOW_BALANCE_PAISE,
    topup: RULES,
    promoExpiryDays: 15,
    cashExpiryDays: 365,
  };
}

function addTx(t: Omit<WalletTransaction, 'id' | 'createdAt'> & { paymentId?: string }) {
  wallet.tx.unshift({ id: newId('tx'), createdAt: new Date().toISOString(), ...t });
}

/**
 * Pays one weekly-plan visit from the wallet: rewards first (they expire sooner), then cash.
 * Returns false (and changes nothing) when the balance can't cover it — the visit is skipped.
 */
export function spendForVisit(amount: number, title: string): boolean {
  if (wallet.cash + wallet.promo < amount) return false;
  const fromPromo = Math.min(wallet.promo, amount);
  const fromCash = amount - fromPromo;
  wallet.promo -= fromPromo;
  wallet.cash -= fromCash;
  for (const [bucket, part] of [
    ['promo', fromPromo],
    ['cash', fromCash],
  ] as const) {
    if (part > 0)
      addTx({
        direction: 'debit',
        bucket,
        kind: 'booking',
        title,
        amountPaise: part,
        status: 'success',
        expiresAt: null,
      });
  }
  return true;
}

/** Payment for a top-up went to the gateway: show both credits as Pending (F7). */
export function topupPending(paymentId: string, amount: number) {
  const now = Date.now();
  addTx({
    paymentId,
    direction: 'credit',
    bucket: 'cash',
    kind: 'topup',
    title: 'Cash balance added',
    amountPaise: amount,
    status: 'pending',
    expiresAt: new Date(now + 365 * DAY).toISOString(),
  });
  const bonus = bonusFor(amount);
  if (bonus)
    addTx({
      paymentId,
      direction: 'credit',
      bucket: 'promo',
      kind: 'bonus',
      title: 'Reward balance earned',
      amountPaise: bonus,
      status: 'pending',
      expiresAt: new Date(now + 15 * DAY).toISOString(),
    });
}

/** Gateway webhook settled the top-up. */
export function topupSettled(paymentId: string, succeeded: boolean) {
  for (const t of wallet.tx.filter((x) => x.paymentId === paymentId && x.status === 'pending')) {
    t.status = succeeded ? 'success' : 'failed';
    if (succeeded) wallet[t.bucket === 'cash' ? 'cash' : 'promo'] += t.amountPaise;
  }
}

// ---- Pass ------------------------------------------------------------------

export const passOffer: PassOffer = {
  id: 'pass_3x60',
  title: 'ChoreDash Pass',
  visits: 3,
  minutesPerVisit: 60,
  pricePaise: 9_900,
  mrpPaise: 75_000,
  totalWithTaxPaise: 10_395,
  validityDays: 30,
  benefits: [
    { title: 'Save on every booking', body: 'Pay less per visit than booking one at a time.' },
    { title: 'Flexible bookings', body: 'Use it for 30- or 60-minute bookings.' },
    { title: '30 days to use', body: 'Book whenever suits you within 30 days.' },
  ],
  steps: [
    'Buy the Pass once.',
    'It applies automatically when you book.',
    'Minutes are deducted by the length of each booking.',
  ],
  faqs: [
    {
      question: 'What is a ChoreDash Pass?',
      answer: '3 visits of up to 60 minutes each, valid for 30 days.',
    },
    { question: 'Can I share my Pass?', answer: 'No, a Pass is linked to your account.' },
    { question: 'What happens to unused visits?', answer: 'Unused visits expire after 30 days.' },
    {
      question: 'Can I cancel or reschedule a Pass booking?',
      answer: 'Yes, like any booking, within the cancellation policy.',
    },
    {
      question: 'What services can I use my Pass for?',
      answer: 'Hourly Service and single-task services up to 60 minutes.',
    },
  ],
};

let myPass: Pass | null = null;
persisted('pass', {
  save: () => myPass,
  load: (v) => (myPass = v as Pass | null),
  reset: () => (myPass = null),
});

export function passPurchased() {
  myPass = {
    id: newId('pass'),
    visitsTotal: passOffer.visits,
    visitsUsed: 0,
    minutesPerVisit: passOffer.minutesPerVisit,
    expiresAt: new Date(Date.now() + passOffer.validityDays * DAY).toISOString(),
    status: 'active',
  };
}

// ---- Routes ------------------------------------------------------------------

route('GET', '/wallet', (ctx) => {
  requireUser(ctx);
  return summary();
});

route('GET', '/wallet/transactions', (ctx) => {
  requireUser(ctx);
  const page = 20;
  const start = Number(ctx.query?.cursor ?? 0);
  const items = wallet.tx.slice(start, start + page).map(({ paymentId: _p, ...t }) => t);
  return { items, nextCursor: start + page < wallet.tx.length ? String(start + page) : null };
});

route('POST', '/wallet/giftcard', (ctx) => {
  requireUser(ctx);
  return once(ctx.headers['Idempotency-Key'], () => {
    if (Date.now() < wallet.lockedUntil) throw new MockHttpError(429, 'GIFT_CARD_LOCKED');
    const code = String(ctx.body?.code ?? '')
      .toUpperCase()
      .replace(/\s+/g, '');
    if (code !== 'CHOREDASH100' || redeemedGiftCards.has(code)) {
      wallet.giftCardFailures += 1;
      if (wallet.giftCardFailures >= 5) {
        wallet.lockedUntil = Date.now() + 60 * 60_000;
        wallet.giftCardFailures = 0;
        throw new MockHttpError(429, 'GIFT_CARD_LOCKED');
      }
      throw new MockHttpError(400, 'GIFT_CARD_INVALID');
    }
    redeemedGiftCards.add(code);
    wallet.giftCardFailures = 0;
    wallet.cash += 10_000;
    addTx({
      direction: 'credit',
      bucket: 'cash',
      kind: 'giftcard',
      title: 'Gift card claimed',
      amountPaise: 10_000,
      status: 'success',
      expiresAt: new Date(Date.now() + 365 * DAY).toISOString(),
    });
    return { creditedPaise: 10_000, wallet: summary() };
  });
});

route('GET', '/pass/offer', () => passOffer);

route('GET', '/pass/me', (ctx) => {
  requireUser(ctx);
  if (myPass && Date.parse(myPass.expiresAt) < Date.now()) myPass.status = 'expired';
  return myPass?.status === 'active' ? myPass : null;
});
