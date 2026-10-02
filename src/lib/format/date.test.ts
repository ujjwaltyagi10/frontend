import { dayChipLabel, formatDuration, istDateKey, istToUtcIso } from './date';

describe('IST dates', () => {
  it('rolls over to the next IST day at 18:30 UTC', () => {
    expect(istDateKey(new Date('2026-10-01T18:29:00Z'))).toBe('2026-10-01');
    expect(istDateKey(new Date('2026-10-01T18:30:00Z'))).toBe('2026-10-02');
  });

  it('adds whole days', () => {
    expect(istDateKey(new Date('2026-10-31T10:00:00Z'), 1)).toBe('2026-11-01');
  });

  it('converts IST wall-clock to UTC', () => {
    expect(istToUtcIso('2026-10-01', '09:30')).toBe('2026-10-01T04:00:00.000Z');
    expect(istToUtcIso('2026-10-01', '02:00')).toBe('2026-09-30T20:30:00.000Z');
  });

  it('labels day chips', () => {
    expect(dayChipLabel('2026-10-01', 0)).toBe('Today');
    expect(dayChipLabel('2026-10-02', 1)).toBe('Tomorrow');
    expect(dayChipLabel('2026-10-03', 2)).toBe('Sat');
  });

  it('formats durations', () => {
    expect(formatDuration(30)).toBe('30 min');
    expect(formatDuration(90)).toBe('1.5 hr');
  });
});
