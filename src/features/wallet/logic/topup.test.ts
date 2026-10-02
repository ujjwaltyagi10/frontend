import type { TopupRules } from '@/api/types';

import { parseRupees, previewBonus, validateTopup } from './topup';

const rules: TopupRules = {
  minPaise: 100,
  maxPaise: 1_000_000,
  presetsPaise: [25_000, 50_000, 100_000],
  bonus: { minPaise: 25_000, bps: 500 },
};

describe('top-up rules', () => {
  it('gives 5% from ₹250 (Pronto reference: ₹250 → ₹12.5, ₹500 → ₹25, ₹1000 → ₹50)', () => {
    expect(previewBonus(25_000, rules)).toBe(1_250);
    expect(previewBonus(50_000, rules)).toBe(2_500);
    expect(previewBonus(100_000, rules)).toBe(5_000);
  });
  it('gives nothing below ₹250', () => expect(previewBonus(24_900, rules)).toBe(0));
  it('parses typed rupees', () => {
    expect(parseRupees('500')).toBe(50_000);
    expect(parseRupees('₹1,000')).toBe(100_000);
    expect(parseRupees('')).toBeNull();
  });
  it('enforces ₹1–₹10,000', () => {
    expect(validateTopup(0, rules)).toBe('Add at least ₹1');
    expect(validateTopup(1_000_100, rules)).toBe('You can add up to ₹10,000 at a time');
    expect(validateTopup(50_000, rules)).toBeNull();
    expect(validateTopup(null, rules)).toBeNull();
  });
});
