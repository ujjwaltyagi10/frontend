import { useEffect } from 'react';
import { View, type DimensionValue } from 'react-native';
import Animated, {
  useAnimatedStyle,
  useReducedMotion,
  useSharedValue,
  withRepeat,
  withTiming,
} from 'react-native-reanimated';

import { colors, motion, radius } from '@/theme';

type Props = {
  width?: DimensionValue;
  height?: DimensionValue;
  aspectRatio?: number;
  rounded?: keyof typeof radius;
};

/** Content-shaped placeholder for first loads (B5). Pulses unless Reduce Motion is on. */
export function Skeleton({ width = '100%', height = 16, aspectRatio, rounded = 'chip' }: Props) {
  const reduceMotion = useReducedMotion();
  const opacity = useSharedValue(1);

  useEffect(() => {
    if (reduceMotion) return;
    opacity.value = withRepeat(withTiming(0.45, { duration: motion.slow * 2 }), -1, true);
  }, [opacity, reduceMotion]);

  const style = useAnimatedStyle(() => ({ opacity: opacity.value }));

  return (
    <Animated.View
      accessible={false}
      style={[
        {
          width,
          height: aspectRatio ? undefined : height,
          aspectRatio,
          borderRadius: radius[rounded],
          backgroundColor: colors.surface.muted,
        },
        style,
      ]}
    />
  );
}

/** A few lines of text-shaped skeleton. */
export function SkeletonText({ lines = 3 }: { lines?: number }) {
  return (
    <View className="gap-2" accessibilityLabel="Loading" accessibilityRole="progressbar">
      {Array.from({ length: lines }, (_, i) => (
        <Skeleton key={i} width={i === lines - 1 ? '60%' : '100%'} />
      ))}
    </View>
  );
}
