import { Image } from 'expo-image';
import { router } from 'expo-router';
import { View } from 'react-native';

import { illustrations } from '@/components/illustrations';
import { Button, Screen, Text } from '@/components/ui';
import { useTranslation } from '@/lib/i18n';

/** A2 — ask how to set the location. */
export function LocationPermissionScreen() {
  const { t } = useTranslation('onboarding');
  return (
    <Screen scroll={false} testID="A2">
      <View className="flex-1 gap-3 pb-6">
        <Text variant="h1">{t('location.title')}</Text>
        <Text tone="muted">{t('location.subtitle')}</Text>
        <Image
          source={illustrations.locationCity}
          style={{ flex: 1, width: '100%' }}
          contentFit="contain"
          accessible={false}
        />
        <Button fullWidth title={t('location.useCurrent')} onPress={() => router.push('/locating')} />
        <Button
          fullWidth
          variant="secondary"
          title={t('location.enterManually')}
          onPress={() => router.push('/location-search')}
        />
      </View>
    </Screen>
  );
}
