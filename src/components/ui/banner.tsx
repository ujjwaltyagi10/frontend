import type { ReactNode } from 'react';
import { Pressable, View } from 'react-native';

import { colors } from '@/theme';

import { Icon, icons } from './icon';
import { Text } from './text';

const tones = {
  info: { box: 'bg-card border border-line', icon: icons.info, text: 'default' },
  warning: { box: 'bg-warning', icon: icons.warning, text: 'default' },
  offer: { box: 'bg-primary', icon: icons.gift, text: 'onPrimary' },
} as const;

type Props = {
  tone?: keyof typeof tones;
  title: string;
  message?: string;
  onPress?: () => void;
  /** Trailing element, e.g. a "See savings" link. */
  action?: ReactNode;
};

/** Inline notice: "No instant slots" / "Large order" (warning), Pass and wallet offers (offer). */
export function Banner({ tone = 'info', title, message, onPress, action }: Props) {
  const t = tones[tone];
  const body = (
    <View className={`flex-row items-start gap-3 rounded-card p-4 ${t.box}`}>
      <Icon name={t.icon} color={tone === 'offer' ? colors.brand.onPrimary : colors.text.primary} />
      <View className="flex-1 gap-0.5">
        <Text weight="semibold" tone={t.text}>
          {title}
        </Text>
        {message && (
          <Text variant="caption" tone={tone === 'offer' ? 'onPrimaryMuted' : 'muted'}>
            {message}
          </Text>
        )}
      </View>
      {action}
    </View>
  );
  if (!onPress) return <View accessibilityRole="alert">{body}</View>;
  return (
    <Pressable accessibilityRole="button" onPress={onPress} className="active:opacity-80">
      {body}
    </Pressable>
  );
}
