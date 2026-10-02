import { Image } from 'expo-image';
import { router } from 'expo-router';
import { Pressable, View } from 'react-native';

import { illustrations } from '@/components/illustrations';
import { Text } from '@/components/ui';
import { useTranslation } from '@/lib/i18n';

/** B6: the selected location isn't served yet — browse anyway, or change the location. */
export function ComingSoonCard() {
  const { t } = useTranslation('home');
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={`${t('comingSoon.title')}. ${t('comingSoon.message')} ${t('comingSoon.change')}`}
      onPress={() => router.push('/change-location')}
      className="flex-row items-center gap-3 rounded-card border border-line bg-card p-3 active:opacity-80">
      {/* White like the art's own backdrop, zoomed so the city fills the tile edge to edge. */}
      <View className="h-14 w-14 overflow-hidden rounded-card bg-card">
        <Image
          source={illustrations.locationCity}
          style={{ width: 56, height: 56, transform: [{ scale: 1.35 }] }}
          contentFit="cover"
        />
      </View>
      <View className="flex-1 gap-0.5">
        <Text weight="semibold">{t('comingSoon.title')}</Text>
        <Text variant="caption" tone="muted">
          {t('comingSoon.message')}
        </Text>
      </View>
      <View className="rounded-pill bg-tint px-3 py-1.5">
        <Text variant="caption" weight="semibold" tone="accent">
          {t('comingSoon.change')}
        </Text>
      </View>
    </Pressable>
  );
}
