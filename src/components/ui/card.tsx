import type { ReactNode } from 'react';
import { Pressable, View } from 'react-native';

const tones = {
  default: 'border border-line bg-card',
  dark: 'bg-dark',
  tint: 'bg-tint',
  muted: 'bg-muted',
} as const;

type Props = {
  children: ReactNode;
  tone?: keyof typeof tones;
  /** Makes the whole card tappable with pressed feedback. */
  onPress?: () => void;
  accessibilityLabel?: string;
  /** Layout only (gap, padding overrides, flex). */
  className?: string;
};

/** Flat surface with a 1px border (Frontend Spec → Elevation). Content goes in children. */
export function Card({ children, tone = 'default', onPress, accessibilityLabel, className = '' }: Props) {
  const cls = `gap-2 rounded-card p-4 ${tones[tone]} ${className}`;
  if (!onPress) return <View className={cls}>{children}</View>;
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={accessibilityLabel}
      onPress={onPress}
      className={`${cls} active:opacity-70`}>
      {children}
    </Pressable>
  );
}
