import type { IsoDateTime } from '@/api/types';
import { formatTime, istDateKey, istToUtcIso } from '@/lib/format';

/** Week starting Monday, as people in India read it. Values follow the API: 0 = Sunday … 6 = Saturday. */
export const WEEKDAYS = [
  { value: 1, short: 'Mon' },
  { value: 2, short: 'Tue' },
  { value: 3, short: 'Wed' },
  { value: 4, short: 'Thu' },
  { value: 5, short: 'Fri' },
  { value: 6, short: 'Sat' },
  { value: 0, short: 'Sun' },
] as const;

/** A visit closer than this can't be held from the wallet in time, so it isn't the first one. */
export const SKIP_CUTOFF_HOURS = 12;

/** IST "HH:mm" of a UTC instant. */
export const istHhmm = (iso: IsoDateTime) =>
  new Date(new Date(iso).getTime() + 330 * 60_000).toISOString().slice(11, 16);

/** "09:00" → "9:00 am" in the app's time format. */
export const formatSlotTime = (hhmm: string) => formatTime(istToUtcIso(istDateKey(), hhmm));

/** "Every Mon, Wed, Fri at 9:00 am" — or "Every day" / "Every weekday" when that's what it is. */
export function describePlan(daysOfWeek: number[], slotTime: string): string {
  const set = new Set(daysOfWeek);
  const days =
    set.size === 7
      ? 'Every day'
      : set.size === 5 && [1, 2, 3, 4, 5].every((d) => set.has(d))
        ? 'Every weekday'
        : `Every ${WEEKDAYS.filter((d) => set.has(d.value))
            .map((d) => d.short)
            .join(', ')}`;
  return `${days} at ${formatSlotTime(slotTime)}`;
}

/** The first chosen weekday at the plan time that is at least SKIP_CUTOFF_HOURS away. */
export function firstVisitAt(daysOfWeek: number[], slotTime: string, now = new Date()): IsoDateTime | null {
  for (let add = 0; add < 15; add++) {
    const day = istDateKey(now, add);
    const weekday = new Date(`${day}T00:00:00Z`).getUTCDay();
    const at = istToUtcIso(day, slotTime);
    const ahead = new Date(at).getTime() - now.getTime();
    if (daysOfWeek.includes(weekday) && ahead >= SKIP_CUTOFF_HOURS * 3_600_000) return at;
  }
  return null;
}
