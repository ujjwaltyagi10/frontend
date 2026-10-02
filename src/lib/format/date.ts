import type { IsoDateTime } from '@/api/types';

// All times are UTC on the wire and shown in IST (Frontend Spec → Localisation).
// IST has no daylight saving, so a fixed +5:30 offset is exact.
const TZ = 'Asia/Kolkata';
const IST_OFFSET_MIN = 330;
const DAY_MS = 86_400_000;

const timeFmt = new Intl.DateTimeFormat('en-IN', { timeZone: TZ, hour: 'numeric', minute: '2-digit' });
const dayFmt = new Intl.DateTimeFormat('en-IN', {
  timeZone: TZ,
  weekday: 'short',
  day: 'numeric',
  month: 'short',
});
const weekdayFmt = new Intl.DateTimeFormat('en-IN', { timeZone: 'UTC', weekday: 'short' });

export const formatTime = (iso: IsoDateTime) => timeFmt.format(new Date(iso));
export const formatDay = (iso: IsoDateTime) => dayFmt.format(new Date(iso));

/** 30 → "30 min", 60 → "1 hr", 90 → "1.5 hr" */
export function formatDuration(minutes: number): string {
  return minutes < 60 ? `${minutes} min` : `${minutes / 60} hr`;
}

/** IST calendar day "YYYY-MM-DD" for an instant, optionally shifted by whole days. */
export function istDateKey(at: Date = new Date(), addDays = 0): string {
  return new Date(at.getTime() + IST_OFFSET_MIN * 60_000 + addDays * DAY_MS).toISOString().slice(0, 10);
}

/** UTC ISO timestamp for an IST wall-clock time on an IST day: ("2026-10-01", "09:30") → "2026-10-01T04:00:00.000Z". */
export function istToUtcIso(dateKey: string, hhmm: string): IsoDateTime {
  const [y, m, d] = dateKey.split('-').map(Number);
  const [hh, mm] = hhmm.split(':').map(Number);
  return new Date(Date.UTC(y, m - 1, d, hh, mm) - IST_OFFSET_MIN * 60_000).toISOString();
}

/** Chip label for a day offset from today: "Today", "Tomorrow", then "Thu". */
export function dayChipLabel(dateKey: string, offset: number): string {
  if (offset === 0) return 'Today';
  if (offset === 1) return 'Tomorrow';
  return weekdayFmt.format(new Date(`${dateKey}T00:00:00Z`));
}
