import { useEffect, useState, type ReactNode } from 'react';
import { ActivityIndicator, ScrollView, View, type ScrollViewProps } from 'react-native';
import { Gesture, GestureDetector } from 'react-native-gesture-handler';
import Animated, {
  interpolate,
  runOnJS,
  useAnimatedScrollHandler,
  useAnimatedStyle,
  useSharedValue,
  withTiming,
} from 'react-native-reanimated';

import { colors, motion, shadows } from '@/theme';

import { Icon } from './icon';

const AnimatedScrollView = Animated.createAnimatedComponent(ScrollView);

const SIZE = 40; // spinner disc
const TRIGGER = 72; // pull distance that starts a refresh
const REST = 56; // where the disc waits while refreshing
const MAX = 110; // furthest it follows the finger
const RESISTANCE = 0.55; // finger travel → disc travel

type Props = Omit<ScrollViewProps, 'refreshControl' | 'onScroll'> & {
  /** Return a promise (e.g. `query.refetch`) and the spinner stays until it settles. */
  onRefresh?: () => unknown;
  /** Also show the spinner while this is true (a refetch started elsewhere). */
  refreshing?: boolean;
  children: ReactNode;
};

/**
 * Pull to refresh where the page stays put and only a round spinner drops down over it (the
 * reference app's behaviour, and Android's), instead of iOS dragging the whole page down.
 */
export function RefreshScrollView({ onRefresh, refreshing = false, children, ...rest }: Props) {
  const scrollY = useSharedValue(0);
  const pull = useSharedValue(0);
  const fromTop = useSharedValue(false);
  const [busy, setBusy] = useState(false);
  const spinning = busy || refreshing;
  const spinningSV = useSharedValue(false);

  useEffect(() => {
    spinningSV.set(spinning);
    pull.set(withTiming(spinning ? REST : 0, { duration: motion.base }));
  }, [spinning, pull, spinningSV]);

  const run = async () => {
    setBusy(true);
    try {
      await onRefresh?.();
    } finally {
      setBusy(false);
    }
  };

  const onScroll = useAnimatedScrollHandler((e) => {
    scrollY.set(e.contentOffset.y);
  });

  const pan = Gesture.Pan()
    .enabled(!!onRefresh)
    .activeOffsetY(8)
    .failOffsetX([-16, 16])
    .onStart(() => {
      fromTop.set(scrollY.get() <= 0 && !spinningSV.get());
    })
    .onUpdate((e) => {
      if (fromTop.get()) pull.set(Math.min(MAX, Math.max(0, e.translationY * RESISTANCE)));
    })
    .onEnd(() => {
      if (!fromTop.get()) return;
      fromTop.set(false);
      if (pull.get() >= TRIGGER) {
        spinningSV.set(true);
        pull.set(withTiming(REST, { duration: motion.base }));
        runOnJS(run)();
      } else {
        pull.set(withTiming(0, { duration: motion.base }));
      }
    });

  const disc = useAnimatedStyle(() => ({
    opacity: interpolate(pull.get(), [0, TRIGGER * 0.4], [0, 1], 'clamp'),
    transform: [
      { translateY: pull.get() - SIZE },
      { scale: interpolate(pull.get(), [0, TRIGGER], [0.6, 1], 'clamp') },
    ],
  }));
  // The arrow turns with the pull, so the user can feel when it's far enough.
  const arrow = useAnimatedStyle(() => ({
    transform: [{ rotate: `${interpolate(pull.get(), [0, TRIGGER], [0, 270], 'clamp')}deg` }],
  }));

  return (
    <View className="flex-1">
      <GestureDetector gesture={Gesture.Simultaneous(pan, Gesture.Native())}>
        <AnimatedScrollView
          {...rest}
          onScroll={onScroll}
          scrollEventThrottle={16}
          // The page itself never stretches past the top; the disc shows the pull instead.
          bounces={!onRefresh}
          overScrollMode="never">
          {children}
        </AnimatedScrollView>
      </GestureDetector>
      {onRefresh && (
        <View pointerEvents="none" className="absolute inset-x-0 top-0 items-center">
          <Animated.View
            className="items-center justify-center rounded-pill bg-card"
            style={[{ width: SIZE, height: SIZE, boxShadow: shadows.raised }, disc]}
            accessibilityLabel={spinning ? 'Refreshing' : undefined}>
            {spinning ? (
              <ActivityIndicator color={colors.brand.primaryStrong} />
            ) : (
              <Animated.View style={arrow}>
                <Icon
                  name={{ ios: 'arrow.clockwise', android: 'refresh', web: 'refresh' }}
                  size={18}
                  color={colors.brand.primaryStrong}
                />
              </Animated.View>
            )}
          </Animated.View>
        </View>
      )}
    </View>
  );
}
