import { router, useLocalSearchParams } from 'expo-router';
import { useEffect, useMemo, useState } from 'react';
import { ScrollView, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { Banner, Button, Chip, EmptyState, Skeleton, StateView, StickyFooter, Text } from '@/components/ui';
import { ARRIVAL_WINDOW_MIN } from '@/config/constants';
import { track } from '@/lib/analytics';
import { dayChipLabel, formatDuration, formatMoney, formatTime, istDateKey } from '@/lib/format';
import { selectTotalMinutes, useCartDraftStore, useLocationStore } from '@/stores';

import { useServiceDurations } from '../hooks/use-service-durations';
import { useSlots } from '../hooks/use-slots';

const DAYS_AHEAD = 7;
/** Scheduling from Home with an empty cart books the Hourly Service (Screen Flow D1). */
const DEFAULT_SERVICE = 'hourly';

/** D1 Schedule for later (CD-038): day chips, duration (when the cart is empty), slot grid. */
export function ScheduleScreen() {
  const { from } = useLocalSearchParams<{ from?: string }>();
  const hubId = useLocationStore((s) => s.location?.hubId ?? null);
  const cartMinutes = useCartDraftStore(selectTotalMinutes);
  const currentSlot = useCartDraftStore((s) => s.slotStart);
  const addItem = useCartDraftStore((s) => s.addItem);
  const setSlot = useCartDraftStore((s) => s.setSlot);

  const cartIsEmpty = cartMinutes === 0;
  const durations = useServiceDurations(DEFAULT_SERVICE, cartIsEmpty);
  const [pickedDuration, setPickedDuration] = useState(60);
  const duration = cartIsEmpty ? pickedDuration : cartMinutes;

  const days = useMemo(
    () => Array.from({ length: DAYS_AHEAD }, (_, i) => ({ key: istDateKey(new Date(), i), offset: i })),
    [],
  );
  const [day, setDay] = useState(days[0].key);
  const [slot, setSlotLocal] = useState<string | null>(currentSlot);
  const slots = useSlots(hubId, day, duration);
  const available = slots.data?.slots.filter((s) => s.available) ?? [];

  const confirm = () => {
    if (!slot) return;
    if (cartIsEmpty) addItem(DEFAULT_SERVICE, pickedDuration);
    setSlot(slot);
    if (from === 'cart' && router.canGoBack()) router.back();
    else router.replace('/cart');
  };

  if (!hubId) {
    return (
      <EmptyState title="We're not in your area yet" message="Change your location to see available slots." />
    );
  }

  return (
    <SafeAreaView edges={['top']} className="flex-1 bg-page" testID="D1">
      <ScrollView contentContainerClassName="gap-5 p-4 pt-6">
        <Text variant="h2">Schedule for later</Text>
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
                  setSlotLocal(null);
                }}
              />
            ))}
          </ScrollView>
        </View>

        <View className="gap-2">
          <Text variant="h3">Service duration</Text>
          {cartIsEmpty ? (
            durations.isPending ? (
              <Skeleton height={44} />
            ) : (
              <View className="flex-row flex-wrap gap-2">
                {durations.data?.map((d) => (
                  <Chip
                    key={d.durationMin}
                    label={formatDuration(d.durationMin)}
                    sublabel={formatMoney(d.pricePaise)}
                    selected={pickedDuration === d.durationMin}
                    onPress={() => {
                      setPickedDuration(d.durationMin);
                      setSlotLocal(null);
                    }}
                  />
                ))}
              </View>
            )
          ) : (
            <Text tone="muted">{formatDuration(cartMinutes)} for the services in your cart</Text>
          )}
        </View>

        <View className="gap-2">
          <Text variant="h3">Pick a slot</Text>
          {slots.isPending ? (
            <View className="flex-row flex-wrap gap-2">
              {Array.from({ length: 8 }, (_, i) => (
                <Skeleton key={i} width="22%" height={44} />
              ))}
            </View>
          ) : slots.isError ? (
            <StateView state="error" error={slots.error} onRetry={slots.refetch} />
          ) : available.length === 0 ? (
            <SlotsEmpty />
          ) : (
            <View className="flex-row flex-wrap gap-2">
              {slots.data.slots.map((s) => (
                <Chip
                  key={s.start}
                  label={formatTime(s.start)}
                  disabled={!s.available}
                  selected={slot === s.start}
                  onPress={() => setSlotLocal(s.start)}
                />
              ))}
            </View>
          )}
        </View>

        <Banner title={`Your professional arrives within ${ARRIVAL_WINDOW_MIN} minutes of the slot`} />
      </ScrollView>
      <StickyFooter>
        <Button
          title={cartIsEmpty ? 'Add to cart' : 'Confirm slot'}
          size="lg"
          fullWidth
          disabled={!slot}
          onPress={confirm}
        />
      </StickyFooter>
    </SafeAreaView>
  );
}

function SlotsEmpty() {
  useEffect(() => track('slot_unavailable_shown', { mode: 'scheduled', reason: 'NO_SLOTS' }), []);
  return (
    <View className="rounded-card bg-warning p-4">
      <Text weight="semibold">No slots available</Text>
      <Text variant="caption" tone="muted">
        All our partners are busy on this day. Try another day.
      </Text>
    </View>
  );
}
