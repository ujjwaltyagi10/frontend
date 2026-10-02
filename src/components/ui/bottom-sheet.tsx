import type { ReactNode } from 'react';
import { Modal, Pressable, View } from 'react-native';
import Animated, { FadeIn, FadeOut, SlideInDown, SlideOutDown } from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { motion, shadows } from '@/theme';

import { Button } from './button';
import { Text } from './text';

type SheetProps = {
  visible: boolean;
  onClose: () => void;
  title?: string;
  children: ReactNode;
};

/**
 * Bottom-anchored sheet sized to its content: solid card, dimmed backdrop (tap to close), Android
 * Back closes it. A React Native Modal rather than @expo/ui's native sheet, which on iOS 26 drew
 * see-through glass, sized React content to its intrinsic width and left half the sheet empty.
 */
export function BottomSheet({ visible, onClose, title, children }: SheetProps) {
  const insets = useSafeAreaInsets();
  return (
    <Modal visible={visible} transparent animationType="none" onRequestClose={onClose} statusBarTranslucent>
      {visible && (
        <View className="flex-1 justify-end">
          <Animated.View
            entering={FadeIn.duration(motion.base)}
            exiting={FadeOut.duration(motion.fast)}
            className="absolute inset-0 bg-dark/40">
            <Pressable
              className="flex-1"
              onPress={onClose}
              accessibilityRole="button"
              accessibilityLabel="Close"
            />
          </Animated.View>
          <Animated.View
            entering={SlideInDown.duration(motion.slow)}
            exiting={SlideOutDown.duration(motion.base)}
            accessibilityViewIsModal
            className="gap-4 rounded-t-hero bg-card px-4 pt-3"
            style={{ paddingBottom: Math.max(insets.bottom, 16) + 8, boxShadow: shadows.raised }}>
            <View className="h-1 w-10 self-center rounded-pill bg-line" accessible={false} />
            {title && (
              <Text variant="h3" accessibilityRole="header">
                {title}
              </Text>
            )}
            {children}
          </Animated.View>
        </View>
      )}
    </Modal>
  );
}

type ConfirmProps = {
  visible: boolean;
  onClose: () => void;
  title: string;
  message?: string;
  confirmTitle: string;
  cancelTitle: string;
  onConfirm: () => void;
  destructive?: boolean;
  loading?: boolean;
};

/** Two-button confirmation: Log out (H11), "Are you sure you want to exit?" payment (F6). */
export function ConfirmSheet({
  visible,
  onClose,
  title,
  message,
  confirmTitle,
  cancelTitle,
  onConfirm,
  destructive = false,
  loading = false,
}: ConfirmProps) {
  return (
    <BottomSheet visible={visible} onClose={onClose} title={title}>
      {message && <Text tone="muted">{message}</Text>}
      <View className="flex-row gap-3">
        <Button title={cancelTitle} variant="secondary" className="flex-1" onPress={onClose} />
        <Button
          title={confirmTitle}
          variant={destructive ? 'destructive' : 'primary'}
          className="flex-1"
          loading={loading}
          onPress={onConfirm}
        />
      </View>
    </BottomSheet>
  );
}
