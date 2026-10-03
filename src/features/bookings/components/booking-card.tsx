import { router } from 'expo-router';
import { Pressable, View } from 'react-native';

import type { BookingSummary } from '@/api';
import { ServiceArt } from '@/components/service-art';
import { Badge, Text } from '@/components/ui';
import { formatDay, formatDuration, formatMoney, formatTime } from '@/lib/format';

import { STATUS } from '../logic/status';

/** G1 row, same layout as a weekly-plan card: service picture, what and when, status, price. */
export function BookingCard({ booking: b }: { booking: BookingSummary }) {
  const status = STATUS[b.status];
  const slug = b.serviceSlugs?.[0] ?? '';
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={`${b.serviceNames.join(', ')}, ${formatDay(b.slotStart)} ${formatTime(b.slotStart)}, ${status.label}`}
      onPress={() => router.push({ pathname: '/bookings/[id]', params: { id: b.id } })}
      className="gap-3 rounded-card border border-line bg-card p-4 active:opacity-80">
      <View className="flex-row items-center gap-3">
        <ServiceArt slug={slug} size={48} rounded="chip" />
        <View className="flex-1 gap-0.5">
          <Text weight="semibold" numberOfLines={1}>
            {b.serviceNames.join(', ')}
          </Text>
          <Text variant="caption" tone="muted">
            {formatDay(b.slotStart)} · {formatTime(b.slotStart)}
          </Text>
        </View>
        <Badge
          label={b.mode === 'recurring' ? 'Weekly plan' : status.label}
          tone={b.mode === 'recurring' ? 'primary' : status.tone}
        />
      </View>
      <Text variant="caption" tone="muted">
        {formatMoney(b.totalPaise)} · {formatDuration(b.durationMin)}
      </Text>
    </Pressable>
  );
}
