import { router, useLocalSearchParams } from 'expo-router';
import { View } from 'react-native';

import type { BookingDetail, BookingStatus } from '@/api';
import { Badge, Button, Card, Icon, icons, Screen, SkeletonText, StateView, Text } from '@/components/ui';
import { ARRIVAL_WINDOW_MIN } from '@/config/constants';
import { formatDay, formatDuration, formatMoney, formatTime } from '@/lib/format';
import { colors } from '@/theme';

import { useBookingDetail } from '../hooks/use-booking-detail';

const STATUS: Record<
  BookingStatus,
  { label: string; tone: 'primary' | 'success' | 'neutral' | 'danger' | 'dark' }
> = {
  draft: { label: 'Draft', tone: 'neutral' },
  pending_payment: { label: 'Awaiting payment', tone: 'neutral' },
  confirmed: { label: 'Confirmed', tone: 'success' },
  assigned: { label: 'Professional assigned', tone: 'success' },
  in_progress: { label: 'In progress', tone: 'primary' },
  completed: { label: 'Completed', tone: 'dark' },
  cancelled: { label: 'Cancelled', tone: 'danger' },
  payment_failed: { label: 'Payment failed', tone: 'danger' },
};

/** Booking detail (CD-060; final design pending): status, timeline, services, address, bill. */
export function BookingDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const booking = useBookingDetail(id);

  if (booking.isPending)
    return (
      <Screen edges={[]}>
        <SkeletonText lines={8} />
      </Screen>
    );
  if (booking.isError) return <StateView state="error" error={booking.error} onRetry={booking.refetch} />;

  const b = booking.data;
  const s = STATUS[b.status];
  return (
    <Screen edges={[]} testID="BookingDetail" onRefresh={booking.refetch} refreshing={booking.isRefetching}>
      <View className="gap-2">
        <Badge label={s.label} tone={s.tone} />
        <Text variant="h2">{b.serviceNames.join(', ')}</Text>
        <Text tone="muted">
          {formatDay(b.slotStart)}, {formatTime(b.slotStart)} – {formatTime(b.slotEnd)} ·{' '}
          {formatDuration(b.durationMin)}
        </Text>
      </View>

      <Professional booking={b} />

      <Card>
        <Text variant="h3">Address</Text>
        <View className="flex-row items-start gap-2">
          <Icon name={icons.location} size={16} />
          <Text className="flex-1">{b.addressLine}</Text>
        </View>
      </Card>

      <Card>
        <Text variant="h3">Services</Text>
        {b.items.map((it) => (
          <View key={it.name} className="flex-row justify-between">
            <Text>
              {it.name} · {formatDuration(it.durationMin)}
            </Text>
            <Text>{formatMoney(it.pricePaise)}</Text>
          </View>
        ))}
        <View className="gap-1 border-t border-line pt-3">
          <Row label="Item total" value={formatMoney(b.bill.itemTotalPaise)} />
          {b.bill.discountPaise > 0 && (
            <Row
              label={`Coupon ${b.bill.couponCode ?? ''}`}
              value={`−${formatMoney(b.bill.discountPaise)}`}
            />
          )}
          <Row label="GST & service fees" value={formatMoney(b.bill.feesPaise)} />
          <Row label="Paid" value={formatMoney(b.bill.totalPaise)} strong />
        </View>
      </Card>

      <Card>
        <Text variant="h3">Timeline</Text>
        {b.timeline.map((t, i) => (
          <View key={`${t.status}-${i}`} className="flex-row items-center gap-3">
            <Icon name={icons.check} size={14} color={colors.success} />
            <Text className="flex-1">{STATUS[t.status].label}</Text>
            <Text variant="caption" tone="muted">
              {formatDay(t.at)}, {formatTime(t.at)}
            </Text>
          </View>
        ))}
      </Card>

      {/* Cancel and reschedule wait for the cancellation policy (Q-10, CD-061). */}
      <Button
        title="Need help with this booking?"
        variant="secondary"
        fullWidth
        onPress={() => router.push('/support')}
      />
    </Screen>
  );
}

function Professional({ booking: b }: { booking: BookingDetail }) {
  if (b.status === 'cancelled' || b.status === 'completed') return null;
  return (
    <Card tone="tint">
      <Text weight="semibold">Your professional</Text>
      <Text variant="caption" tone="muted">
        {b.arrivalEstimate
          ? `Arriving around ${formatTime(b.arrivalEstimate)}`
          : `We'll share their name before the visit. They arrive within ${ARRIVAL_WINDOW_MIN} minutes of your slot.`}
      </Text>
    </Card>
  );
}

function Row({ label, value, strong = false }: { label: string; value: string; strong?: boolean }) {
  return (
    <View className="flex-row justify-between">
      <Text weight={strong ? 'semibold' : 'regular'} tone={strong ? 'default' : 'muted'}>
        {label}
      </Text>
      <Text weight={strong ? 'bold' : 'regular'}>{value}</Text>
    </View>
  );
}
