import { StatusBar } from 'expo-status-bar';
import { useEffect, useState } from 'react';
import { StyleSheet } from 'react-native';
import Animated, { FadeOut } from 'react-native-reanimated';

import { Text } from '@/components/ui';
import { useTranslation } from '@/lib/i18n';
import { colors } from '@/theme';

const HOLD_MS = 1200;

/**
 * A1 Splash, in JS: the same sky-blue brand screen as the native splash, held briefly over the first
 * screen (login or Home) and then faded out. Native splash → this is seamless in real builds; in Expo
 * Go (which shows the app icon instead of the native splash) this is the splash users see.
 */
export function BrandSplash() {
  const { t } = useTranslation('onboarding');
  const [visible, setVisible] = useState(true);

  useEffect(() => {
    const id = setTimeout(() => setVisible(false), HOLD_MS);
    return () => clearTimeout(id);
  }, []);

  if (!visible) return null;
  return (
    <Animated.View
      exiting={FadeOut.duration(350)}
      style={[StyleSheet.absoluteFill, styles.splash]}
      accessibilityLabel={`ChoreDash. ${t('login.tagline')}`}>
      <StatusBar style="light" />
      {/* Shown from the first frame, like the native splash it replaces — no fade-in flicker. */}
      <Text variant="display" tone="onPrimary">
        ChoreDash
      </Text>
      <Text variant="h3" weight="medium" tone="onPrimary" className="text-center">
        {t('login.tagline')}
      </Text>
    </Animated.View>
  );
}

// Plain styles: NativeWind classes aren't reliably applied to Reanimated views.
const styles = StyleSheet.create({
  splash: {
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingHorizontal: 32,
    backgroundColor: colors.brand.primary,
  },
});
