import { useEffect } from 'react';
import { Platform, View } from 'react-native';
import Animated, { FadeInUp, FadeOutUp } from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { FullWindowOverlay } from 'react-native-screens';
import { create } from 'zustand';

import { colors, shadows } from '@/theme';

import { Icon, icons } from './icon';
import { Text } from './text';

type ToastItem = { id: number; message: string };

const useToastStore = create<{ current: ToastItem | null }>(() => ({
  current: null,
}));

let nextId = 1;
const show = (message: string) => useToastStore.setState({ current: { id: nextId++, message } });

/**
 * Errors only: `toast.error(errorMessage(e))`. Success needs no toast — the screen change (going
 * back, the new value showing) is the confirmation.
 */
export const toast = {
  error: (message: string) => show(message),
  info: (message: string) => show(message),
  hide: () => useToastStore.setState({ current: null }),
};

const DURATION_MS = 3000;

/** Mounted once in the root layout. */
export function ToastHost() {
  const current = useToastStore((s) => s.current);
  const insets = useSafeAreaInsets();

  useEffect(() => {
    if (!current) return;
    const id = setTimeout(toast.hide, DURATION_MS);
    return () => clearTimeout(id);
  }, [current]);

  if (!current) return null;
  // iOS native headers and modals draw above normal React views; FullWindowOverlay sits above them.
  const Overlay = Platform.OS === 'ios' ? FullWindowOverlay : View;
  return (
    <Overlay>
      <View pointerEvents="box-none" className="absolute inset-x-4" style={{ top: insets.top + 8 }}>
        <Animated.View
          key={current.id}
          entering={FadeInUp}
          exiting={FadeOutUp}
          accessibilityRole="alert"
          accessibilityLiveRegion="polite"
          className="flex-row items-center gap-3 rounded-card border border-line bg-card px-4 py-3"
          style={{ boxShadow: shadows.raised }}>
          <Icon name={icons.warning} color={colors.danger} />
          <Text className="flex-1">{current.message}</Text>
        </Animated.View>
      </View>
    </Overlay>
  );
}
