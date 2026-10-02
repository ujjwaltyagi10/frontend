// Per-weight imports so only the 4 weights we use are bundled (the package root pulls in all 9).
import { Lexend_400Regular } from '@expo-google-fonts/lexend/400Regular';
import { Lexend_500Medium } from '@expo-google-fonts/lexend/500Medium';
import { Lexend_600SemiBold } from '@expo-google-fonts/lexend/600SemiBold';
import { Lexend_700Bold } from '@expo-google-fonts/lexend/700Bold';
import { useFonts } from 'expo-font';
import * as SplashScreen from 'expo-splash-screen';
import { useEffect, useState } from 'react';

import { useLocationStore, useSessionStore } from '@/stores';

void SplashScreen.preventAutoHideAsync();

/**
 * A1 Splash: keep the native splash up until fonts, the session and persisted stores are read,
 * so the first frame is already the right stack. (Config + force-update check: CD-017.)
 */
export function useBootstrap() {
  const [storesReady, setStoresReady] = useState(false);
  // A font that fails to load falls back to the system font rather than blocking startup.
  const [fontsLoaded, fontError] = useFonts({
    Lexend_400Regular,
    Lexend_500Medium,
    Lexend_600SemiBold,
    Lexend_700Bold,
  });
  const ready = storesReady && (fontsLoaded || !!fontError);

  useEffect(() => {
    const locationHydrated = new Promise<void>((resolve) => {
      if (useLocationStore.persist.hasHydrated()) resolve();
      else useLocationStore.persist.onFinishHydration(() => resolve());
    });
    Promise.all([useSessionStore.getState().hydrate(), locationHydrated]).finally(() => setStoresReady(true));
  }, []);

  useEffect(() => {
    if (ready) void SplashScreen.hideAsync();
  }, [ready]);

  return ready;
}
