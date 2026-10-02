import { useEffect } from 'react';
import { Platform, View } from 'react-native';
import Animated, { FadeInUp, FadeOutUp } from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { FullWindowOverlay } from 'react-native-screens';
import { create } from 'zustand';

import { colors } from '@/theme';

import { Icon, icons } from './icon';
import { Text } from './text';

type ToastItem = { id: number; kind: 'success' | 'error'; message: string };

const useToastStore = create<{ current: ToastItem | null }>(() => ({
  current: null,
}));

let nextId = 1;
const show = (kind: ToastItem['kind'], message: string) =>
  useToastStore.setState({ current: { id: nextId++, kind, message } });

/** Fire-and-forget feedback from anywhere: `toast.success('Address saved')`. */
export const toast = {
  success: (message: string) => show('success', message),
  error: (message: string) => show('error', message),
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
          className="flex-row items-center gap-3 rounded-card bg-dark px-4 py-3">
          <Icon
            name={current.kind === 'success' ? icons.check : icons.warning}
            color={current.kind === 'success' ? colors.brand.primary : colors.danger}
          />
          <Text tone="inverse" className="flex-1">
            {current.message}
          </Text>
        </Animated.View>
      </View>
    </Overlay>
  );
}
