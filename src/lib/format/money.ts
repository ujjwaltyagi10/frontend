import type { Paise } from '@/api/types';

const inr = new Intl.NumberFormat('en-IN', {
  style: 'currency',
  currency: 'INR',
  minimumFractionDigits: 0,
  maximumFractionDigits: 2,
});

/** 2500 → "₹25", 10396 → "₹103.96". All money on the wire is integer paise. */
export function formatMoney(paise: Paise): string {
  return inr.format(paise / 100);
}

/** Percentage saved versus MRP, rounded down: (2500, 12500) → 80. */
export function savingsPercent(pricePaise: Paise, mrpPaise: Paise | null): number {
  if (!mrpPaise || mrpPaise <= pricePaise) return 0;
  return Math.floor(((mrpPaise - pricePaise) / mrpPaise) * 100);
}
