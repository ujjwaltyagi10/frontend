import { StatusBar } from 'expo-status-bar';
import { useEffect, useState } from 'react';
import { Platform, StyleSheet, View } from 'react-native';
import Animated, { FadeIn, FadeOut } from 'react-native-reanimated';

import { Text } from '@/components/ui';
import { useTranslation } from '@/lib/i18n';
import { colors, fontSize } from '@/theme';

// Android's native splash can only show the word (its icon is masked to a circle), so the tagline
// fades in here — hold a little longer there so it's read, not flashed.
const ANDROID = Platform.OS === 'android';
const HOLD_MS = ANDROID ? 1600 : 1200;
const WORD_LINE = fontSize.display[1];

/**
 * A1 Splash, in JS: the same sky-blue brand screen as the native splash, held briefly over the first
 * screen (login or Home) and then faded out. "ChoreDash" sits exactly on the screen centre, like the
 * native splash image, so the hand-off never moves it; the tagline hangs below it. In Expo Go (which
 * shows the app icon instead of the native splash) this is the splash users see.
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
      <Text variant="display" tone="onPrimary">
        ChoreDash
      </Text>
      <View style={styles.taglineRow}>
        <Animated.View entering={ANDROID ? FadeIn.duration(300) : undefined}>
          <Text variant="h3" weight="medium" tone="onPrimary" className="text-center">
            {t('login.tagline')}
          </Text>
        </Animated.View>
      </View>
    </Animated.View>
  );
}

// Plain styles: NativeWind classes aren't reliably applied to Reanimated views.
const styles = StyleSheet.create({
  splash: {
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.brand.primary,
  },
  // Below the centred word: half its line height + 8 pt gap.
  taglineRow: {
    position: 'absolute',
    top: '50%',
    left: 32,
    right: 32,
    marginTop: WORD_LINE / 2 + 8,
    alignItems: 'center',
  },
});
