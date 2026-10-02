import { Image } from 'expo-image';
import { useEffect } from 'react';
import { View } from 'react-native';
import Animated, {
  Easing,
  useAnimatedStyle,
  useReducedMotion,
  useSharedValue,
  withRepeat,
  withTiming,
} from 'react-native-reanimated';

import { serviceArtwork } from '@/components/illustrations';
import { radius } from '@/theme';

const TILE = 92;
const GAP = 8;
const ART = Object.values(serviceArtwork);
// Three rows with no service in common, so the same picture never sits near itself.
const ROWS = [ART.slice(0, 6), ART.slice(6, 11), ART.slice(11)];

/** A7 header collage (Pronto shows task photos): rows of service art drifting in opposite directions. */
export function ServiceCollage() {
  return (
    <View
      className="gap-2 overflow-hidden"
      accessible={false}
      importantForAccessibility="no-hide-descendants">
      {ROWS.map((row, i) => (
        <MarqueeRow key={i} items={row} reverse={i % 2 === 1} offset={i * 30} />
      ))}
    </View>
  );
}

function MarqueeRow({ items, reverse, offset }: { items: typeof ART; reverse: boolean; offset: number }) {
  const span = items.length * (TILE + GAP); // one full copy of the row
  const reduceMotion = useReducedMotion();
  const x = useSharedValue(0);

  useEffect(() => {
    if (reduceMotion) return;
    // Slide exactly one copy's width, then jump back: the duplicate makes the jump invisible.
    x.value = withRepeat(withTiming(1, { duration: span * 45, easing: Easing.linear }), -1, false);
  }, [reduceMotion, span, x]);

  const style = useAnimatedStyle(() => ({
    transform: [{ translateX: -offset + (reverse ? x.value - 1 : -x.value) * span }],
  }));

  return (
    <Animated.View style={[{ flexDirection: 'row', gap: GAP }, style]}>
      {[...items, ...items].map((src, i) => (
        <Image
          key={i}
          source={src}
          style={{ width: TILE, height: TILE, borderRadius: radius.card }}
          contentFit="cover"
        />
      ))}
    </Animated.View>
  );
}
