import * as Location from 'expo-location';
import { router } from 'expo-router';
import { useEffect } from 'react';
import { ActivityIndicator, View } from 'react-native';
import { initialWindowMetrics } from 'react-native-safe-area-context';

import { Screen, Text } from '@/components/ui';
import { LOCATION_TIMEOUT_MS } from '@/config/constants';
import { useTranslation } from '@/lib/i18n';
import { colors } from '@/theme';

import { CityAnimation } from '../components/city-animation';
import { useResolveLocation } from '../hooks/use-resolve-location';

const timeout = (ms: number) =>
  new Promise<never>((_, reject) => setTimeout(() => reject(new Error('timeout')), ms));

/**
 * A3–A4 — right after login: ask for permission, get a GPS fix, check serviceability. Success shows
 * Home (the root layout switches once a location exists); denied or slow → manual search (A5).
 */
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
    // Insets from app launch, not live ones: Android hides the status bar while its permission
    // dialog is up, and live insets made the whole screen jump.
    <Screen scroll={false} edges={[]} testID="A4">
      <View style={{ height: initialWindowMetrics?.insets.top ?? 0 }} />
      <View className="gap-2 pt-6">
        <Text variant="h1">{t('location.title')}</Text>
        <Text tone="muted">{t('location.subtitle')}</Text>
      </View>
      <CityAnimation />
      <View className="flex-row items-center justify-center gap-3 pb-6" accessibilityLiveRegion="polite">
        <ActivityIndicator color={colors.brand.primaryStrong} />
        <Text weight="medium">{t('location.fetching')}</Text>
      </View>
      <View style={{ height: initialWindowMetrics?.insets.bottom ?? 0 }} />
    </Screen>
  );
}
