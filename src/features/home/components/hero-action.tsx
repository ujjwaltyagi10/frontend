import { Pressable, View } from 'react-native';

import { Icon, icons, Text, type IconName } from '@/components/ui';
import { colors } from '@/theme';

type Props = {
  title: string;
  subtitle: string;
  icon: IconName;
  onPress: () => void;
  /** The instant card is the primary path: a cyan-tint icon; scheduling stays grey. */
  primary?: boolean;
};

/** B1 hero entry point (Get Instant Service / Schedule for Later): same size, same border, icon first. */
export function HeroAction({ title, subtitle, icon, onPress, primary = false }: Props) {
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={`${title}. ${subtitle}`}
      onPress={onPress}
      className={`min-h-32 flex-1 justify-between gap-3 rounded-hero border border-line bg-card p-4 active:opacity-80`}>
      <View className="flex-row items-start justify-between">
        <View
          className={`h-10 w-10 items-center justify-center rounded-pill ${primary ? 'bg-tint' : 'bg-muted'}`}>
          <Icon name={icon} size={20} color={primary ? colors.brand.primaryStrong : colors.text.secondary} />
        </View>
        <Icon name={icons.chevronRight} size={12} color={colors.icon} />
      </View>
      <View className="gap-0.5">
        <Text weight="semibold">{title}</Text>
        <Text variant="caption" tone="muted">
          {subtitle}
        </Text>
      </View>
    </Pressable>
  );
}
