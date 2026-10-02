import { useEffect } from 'react';

import type { InstantAvailability } from '@/api';
import { Banner, Button } from '@/components/ui';
import { track } from '@/lib/analytics';
import { formatDay, formatTime } from '@/lib/format';

const titles: Record<NonNullable<InstantAvailability['reason']>, string> = {
  PARTNERS_BUSY: 'No instant slots available right now',
  LARGE_ORDER: 'Large order! No instant slots right now',
  OUTSIDE_HOURS: "We're closed for instant bookings now",
};

/** CT-4: explain why instant isn't possible and offer the next time instead of a dead end. */
export function InstantUnavailableBanner({
  instant,
  onSchedule,
}: {
  instant: InstantAvailability;
  onSchedule: () => void;
}) {
  const reason = instant.reason ?? 'PARTNERS_BUSY';
  useEffect(() => track('slot_unavailable_shown', { mode: 'instant', reason }), [reason]);

  const next = instant.nextAvailableAt;
  return (
    <Banner
      tone="warning"
      title={titles[reason]}
      message={
        next
          ? `Next available: ${formatDay(next)}, ${formatTime(next)}. Please schedule the order.`
          : 'Please schedule the order.'
      }
      action={<Button size="sm" variant="dark" title="Schedule" onPress={onSchedule} />}
    />
  );
}
