import * as Location from 'expo-location';
import { router } from 'expo-router';
import { useEffect } from 'react';
import { ActivityIndicator, View } from 'react-native';

import { Screen, Text } from '@/components/ui';
import { LOCATION_TIMEOUT_MS } from '@/config/constants';
import { useTranslation } from '@/lib/i18n';
import { colors } from '@/theme';

import { useResolveLocation } from '../hooks/use-resolve-location';

const timeout = (ms: number) =>
  new Promise<never>((_, reject) => setTimeout(() => reject(new Error('timeout')), ms));

/** A3–A4 — get a GPS fix, check serviceability; denied or slow → manual search (A5). */
export function LocatingScreen() {
  const { t } = useTranslation('onboarding');
  const resolve = useResolveLocation();
  const { mutate } = resolve;

  useEffect(() => {
    (async () => {
      try {
        const { granted } = await Location.requestForegroundPermissionsAsync();
        if (!granted) throw new Error('denied');
        const pos = await Promise.race([
          Location.getCurrentPositionAsync({ accuracy: Location.Accuracy.Balanced }),
          timeout(LOCATION_TIMEOUT_MS),
        ]);
        mutate(
          { lat: pos.coords.latitude, lng: pos.coords.longitude, method: 'gps' },
          { onError: () => router.replace('/location-search') },
        );
      } catch {
        router.replace('/location-search');
      }
    })();
  }, [mutate]);

  return (
    <Screen scroll={false} testID="A4">
      <View className="flex-1 items-center justify-center gap-3">
        <ActivityIndicator color={colors.text.primary} />
        <Text>{t('location.fetching')}</Text>
      </View>
    </Screen>
  );
}
