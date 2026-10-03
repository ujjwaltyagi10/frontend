import { describePlan, firstVisitAt, istHhmm } from './recurrence';

describe('weekly plan helpers', () => {
  it('names common patterns', () => {
    expect(describePlan([1, 2, 3, 4, 5], '09:00')).toMatch(/^Every weekday at 9:00/i);
    expect(describePlan([0, 1, 2, 3, 4, 5, 6], '18:30')).toMatch(/^Every day at 6:30/i);
    expect(describePlan([5, 1, 3], '07:00')).toMatch(/^Every Mon, Wed, Fri at 7:00/i);
  });

  it('starts on the next chosen day that is at least 12 h away', () => {
    // Wed 1 Oct 2025, 10:00 IST
    const now = new Date('2025-10-01T04:30:00Z');
    // Wednesday 18:00 is only 8 h away → skipped; next Wednesday instead
    expect(firstVisitAt([3], '18:00', now)).toBe('2025-10-08T12:30:00.000Z');
    // Thursday 09:00 is 23 h away → that one
    expect(firstVisitAt([4], '09:00', now)).toBe('2025-10-02T03:30:00.000Z');
    expect(firstVisitAt([], '09:00', now)).toBeNull();
  });

  it('reads IST clock time from a UTC instant', () => {
    expect(istHhmm('2025-10-02T03:30:00.000Z')).toBe('09:00');
  });
});
