import type { Paise } from '@/api/types';

const whole = new Intl.NumberFormat('en-IN', {
  style: 'currency',
  currency: 'INR',
  maximumFractionDigits: 0,
});
const withPaise = new Intl.NumberFormat('en-IN', {
  style: 'currency',
  currency: 'INR',
  minimumFractionDigits: 2,
});

/** 2500 → "₹25", 10396 → "₹103.96", 3150 → "₹31.50" (never "₹31.5"). All money on the wire is integer paise. */
export function formatMoney(paise: Paise): string {
  return paise % 100 === 0 ? whole.format(paise / 100) : withPaise.format(paise / 100);
}

/** Percentage saved versus MRP, rounded down: (2500, 12500) → 80. */
export function savingsPercent(pricePaise: Paise, mrpPaise: Paise | null): number {
  if (!mrpPaise || mrpPaise <= pricePaise) return 0;
  return Math.floor(((mrpPaise - pricePaise) / mrpPaise) * 100);
}
