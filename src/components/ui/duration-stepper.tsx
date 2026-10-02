import { View } from 'react-native';

import { BOOKING_STEP_MIN } from '@/config/constants';
import { formatDuration } from '@/lib/format';

import { icons } from './icon';
import { IconButton } from './icon-button';
import { Text } from './text';

type Props = {
  value: number; // minutes
  onChange: (minutes: number) => void;
  min?: number;
  max?: number;
  step?: number;
  disabled?: boolean;
};

/** − / + in 30-minute steps (D2, D4). The parent re-quotes the cart on change. */
export function DurationStepper({
  value,
  onChange,
  min = BOOKING_STEP_MIN,
  max = 480,
  step = BOOKING_STEP_MIN,
  disabled = false,
}: Props) {
  const canDec = !disabled && value - step >= min;
  const canInc = !disabled && value + step <= max;
  return (
    <View
      accessibilityRole="adjustable"
      accessibilityLabel="Duration"
      accessibilityValue={{ text: formatDuration(value) }}
      accessibilityActions={[{ name: 'increment' }, { name: 'decrement' }]}
      onAccessibilityAction={(e) => {
        if (e.nativeEvent.actionName === 'increment' && canInc) onChange(value + step);
        if (e.nativeEvent.actionName === 'decrement' && canDec) onChange(value - step);
      }}
      className="flex-row items-center self-start rounded-pill border border-line bg-card">
      <IconButton
        icon={icons.minus}
        size={16}
        accessibilityLabel="Decrease duration"
        disabled={!canDec}
        onPress={() => onChange(value - step)}
      />
      <Text variant="caption" weight="semibold" className="min-w-14 text-center">
        {formatDuration(value)}
      </Text>
      <IconButton
        icon={icons.plus}
        size={16}
        accessibilityLabel="Increase duration"
        disabled={!canInc}
        onPress={() => onChange(value + step)}
      />
    </View>
  );
}
