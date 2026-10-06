import { Image, type ImageSource } from 'expo-image';
import type { ReactNode } from 'react';
import { Pressable, View } from 'react-native';

import { colors } from '@/theme';

import { Icon, icons } from './icon';
import { Text } from './text';

const tones = {
  info: { box: 'bg-card border border-line', icon: icons.info, text: 'default' },
  warning: { box: 'bg-warning', icon: icons.warning, text: 'default' },
  offer: { box: 'bg-primary-deep', icon: icons.gift, text: 'onPrimary' },
  // Something the user will lose (e.g. ChoreDash Money on account deletion).
  danger: { box: 'bg-card border-2 border-danger', icon: icons.warning, text: 'danger' },
} as const;

type Props = {
  tone?: keyof typeof tones;
  title: string;
  message?: string;
  onPress?: () => void;
  /** Trailing element, e.g. a "See savings" link. */
  action?: ReactNode;
  /** 3D illustration shown on a white tile in place of the glyph (offer cards). */
  art?: ImageSource;
};

/** Inline notice: "No instant slots" / "Large order" (warning), Pass and wallet offers (offer), losses (danger). */
export function Banner({ tone = 'info', title, message, onPress, action, art }: Props) {
  const t = tones[tone];
  const offer = tone === 'offer';
  const body = (
    <View className={`flex-row gap-3 rounded-card p-4 ${offer ? 'items-center' : 'items-start'} ${t.box}`}>
      {art ? (
        <View className="h-14 w-14 items-center justify-center rounded-card bg-card">
          <Image source={art} style={{ width: 46, height: 46 }} contentFit="contain" accessible={false} />
        </View>
      ) : (
        <Icon
          name={t.icon}
          color={offer ? colors.brand.onPrimary : tone === 'danger' ? colors.danger : colors.text.primary}
        />
      )}
      <View className="flex-1 gap-0.5">
        <Text weight="semibold" tone={t.text}>
          {title}
        </Text>
        {message && (
          <Text variant="caption" tone={offer ? 'onPrimaryMuted' : 'muted'}>
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
