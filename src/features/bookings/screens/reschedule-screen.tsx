import { router, useLocalSearchParams } from 'expo-router';
import { useMemo, useState } from 'react';
import { ScrollView, View } from 'react-native';

import {
  Banner,
  Button,
  Chip,
  Screen,
  Skeleton,
  SkeletonText,
  StateView,
  StickyFooter,
  Text,
  toast,
} from '@/components/ui';
import { useSlots } from '@/hooks';
import { dayChipLabel, formatDay, formatDuration, formatTime, istDateKey } from '@/lib/format';
import { useErrorMessage } from '@/lib/i18n';
import { useLocationStore } from '@/stores';

import { useBookingDetail } from '../hooks/use-booking-detail';
import { useRescheduleBooking } from '../hooks/use-reschedule-booking';

const DAYS_AHEAD = 7;

/** Reschedule (CD-061): pick another day and slot of the same length. Free; nothing is charged. */
export function RescheduleScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const booking = useBookingDetail(id);
  if (booking.isPending)
    return (
      <Screen edges={[]}>
        <SkeletonText lines={8} />
      </Screen>
    );
  if (booking.isError) return <StateView state="error" error={booking.error} onRetry={booking.refetch} />;
  return (
    <Picker
      id={id}
      slotStart={booking.data.slotStart}
      durationMin={booking.data.durationMin}
      until={booking.data.rescheduleUntil ?? null}
    />
  );
}

function Picker({
  id,
  slotStart,
  durationMin,
  until,
}: {
  id: string;
  slotStart: string;
  durationMin: number;
  until: string | null;
}) {
  const hubId = useLocationStore((s) => s.location?.hubId ?? null);
  const days = useMemo(
    () => Array.from({ length: DAYS_AHEAD }, (_, i) => ({ key: istDateKey(new Date(), i), offset: i })),
    [],
  );
  const [day, setDay] = useState(
    istDateKey(new Date(slotStart)) >= days[0].key ? istDateKey(new Date(slotStart)) : days[0].key,
  );
  const [slot, setSlot] = useState<string | null>(null);
  const slots = useSlots(hubId, day, durationMin);
  const reschedule = useRescheduleBooking(id);
  const errorMessage = useErrorMessage();
  const [openedAt] = useState(Date.now);
  const tooLate = !until || openedAt > Date.parse(until);

  const confirm = () =>
    slot &&
    reschedule.mutate(slot, {
      onSuccess: () => router.back(),
      onError: (e) => toast.error(errorMessage(e)),
    });

  return (
    <Screen
      edges={[]}
      testID="Reschedule"
      footer={
        <StickyFooter>
          <Button
            title={slot ? `Move to ${formatDay(slot)}, ${formatTime(slot)}` : 'Pick a new slot'}
            size="lg"
            fullWidth
            disabled={!slot || tooLate}
            loading={reschedule.isPending}
            onPress={confirm}
          />
        </StickyFooter>
      }>
      <View className="gap-1">
        <Text tone="muted">Now booked for</Text>
        <Text weight="semibold">
          {formatDay(slotStart)}, {formatTime(slotStart)} · {formatDuration(durationMin)}
        </Text>
      </View>

      {tooLate ? (
        <Banner tone="warning" title="It's too late to reschedule this booking" />
      ) : (
        <Text variant="caption" tone="muted">
          Free to reschedule until {formatDay(until)}, {formatTime(until)}. Same price — nothing is charged.
        </Text>
      )}

      <View className="gap-2">
        <Text variant="h3">Pick a day</Text>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerClassName="gap-2">
          {days.map((d) => (
            <Chip
              key={d.key}
              label={dayChipLabel(d.key, d.offset)}
              sublabel={d.key.slice(8)}
              selected={day === d.key}
              onPress={() => {
                setDay(d.key);
                setSlot(null);
              }}
            />
          ))}
        </ScrollView>
      </View>

      <View className="gap-2">
        <Text variant="h3">Pick a slot</Text>
        {slots.isPending ? (
          <Skeleton height={96} rounded="card" />
        ) : slots.isError ? (
          <StateView state="error" error={slots.error} onRetry={slots.refetch} />
        ) : slots.data.slots.every((s) => !s.available) ? (
          <Text tone="muted">No slots available on this day.</Text>
        ) : (
          <View className="flex-row flex-wrap gap-2">
            {slots.data.slots.map((s) => (
              <Chip
                key={s.start}
                label={formatTime(s.start)}
                disabled={!s.available || s.start === slotStart}
                selected={slot === s.start}
                onPress={() => setSlot(s.start)}
              />
            ))}
          </View>
        )}
      </View>
    </Screen>
  );
}
