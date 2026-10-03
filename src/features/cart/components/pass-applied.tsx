import { Image } from 'expo-image';
import { View } from 'react-native';

import type { CartQuote } from '@/api';
import { illustrations } from '@/components/illustrations';
import { Text } from '@/components/ui';
import { formatDuration } from '@/lib/format';

/** PS-3/PS-6: the Pass was applied to this booking — what it covers and what's left after. */
export function PassApplied({ pass }: { pass: NonNullable<CartQuote['pass']> }) {
  const left =
    pass.visitsLeftAfter === 0
      ? 'This is your last Pass visit.'
      : `${pass.visitsLeftAfter} ${pass.visitsLeftAfter === 1 ? 'visit' : 'visits'} left after this booking.`;
  return (
    <View
      className="flex-row items-center gap-3 rounded-card border border-line bg-card p-3"
      accessible
      accessibilityLabel={`ChoreDash Pass applied. Covers ${formatDuration(pass.minutesCovered)}. ${left}`}>
      <View className="h-12 w-12 items-center justify-center rounded-card bg-tint">
        <Image source={illustrations.passTickets} style={{ width: 40, height: 30 }} contentFit="contain" />
      </View>
      <View className="flex-1 gap-0.5">
        <Text weight="semibold">ChoreDash Pass applied</Text>
        <Text variant="caption" tone="muted">
          Covers {formatDuration(pass.minutesCovered)} of this booking · {left}
        </Text>
      </View>
    </View>
  );
}
