import { Image, type ImageSource } from 'expo-image';
import { Pressable, View } from 'react-native';

import { Icon, icons, Text } from '@/components/ui';
import { colors } from '@/theme';

type Props = {
  title: string;
  subtitle: string;
  /** 3D icon illustration (lightning / calendar). */
  art: ImageSource;
  onPress: () => void;
};

/** B1 hero entry point (Get Instant Service / Schedule for Later): title first, 3D icon bottom-right. */
export function HeroAction({ title, subtitle, art, onPress }: Props) {
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={`${title}. ${subtitle}`}
      onPress={onPress}
      className="min-h-32 flex-1 justify-between rounded-hero border border-line bg-card p-4 active:opacity-80">
      <View className="flex-row items-start justify-between gap-2">
        <View className="flex-1 gap-0.5">
          <Text weight="semibold">{title}</Text>
          <Text variant="caption" tone="muted">
            {subtitle}
          </Text>
        </View>
        <Icon name={icons.chevronRight} size={12} color={colors.icon} />
      </View>
      <Image source={art} style={{ width: 52, height: 52, alignSelf: 'flex-end' }} accessible={false} />
    </Pressable>
  );
}
