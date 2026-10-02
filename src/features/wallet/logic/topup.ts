import type { Paise, TopupRules } from '@/api/types';
import { formatMoney } from '@/lib/format';

/**
 * Preview of the promo bonus for a top-up, from the rules the server sent (F1 shows it live).
 * The server computes the real credit; this only labels the chips and the summary line.
 */
export function previewBonus(amountPaise: Paise, rules: TopupRules): Paise {
  return amountPaise >= rules.bonus.minPaise ? Math.round((amountPaise * rules.bonus.bps) / 10_000) : 0;
}

/** Rupees typed by the user (digits only) → paise, or null when empty. */
export function parseRupees(text: string): Paise | null {
  const digits = text.replace(/\D/g, '');
  return digits ? Number(digits) * 100 : null;
}

/** Error message for an amount outside the allowed range, or null when it's fine. */
export function validateTopup(amountPaise: Paise | null, rules: TopupRules): string | null {
  if (amountPaise === null) return null;
  if (amountPaise < rules.minPaise) return `Add at least ${formatMoney(rules.minPaise)}`;
  if (amountPaise > rules.maxPaise) return `You can add up to ${formatMoney(rules.maxPaise)} at a time`;
  return null;
}
