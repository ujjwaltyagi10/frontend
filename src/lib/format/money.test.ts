import { formatMoney, savingsPercent } from './money';

describe('formatMoney', () => {
  it('formats whole rupees without decimals', () => {
    expect(formatMoney(2500)).toBe('₹25');
  });
  it('keeps paise when present, always two digits', () => {
    expect(formatMoney(10396)).toBe('₹103.96');
    expect(formatMoney(3150)).toBe('₹31.50');
  });
  it('uses Indian digit grouping', () => {
    expect(formatMoney(1_00_000_00)).toBe('₹1,00,000');
  });
});

describe('savingsPercent', () => {
  it('returns 0 without an MRP', () => expect(savingsPercent(2500, null)).toBe(0));
  it('rounds down', () => expect(savingsPercent(2500, 12500)).toBe(80));
});
