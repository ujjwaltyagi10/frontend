import '../global.css';

import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';

import { ToastHost } from '@/components/ui';
import { AppProviders } from '@/providers/app-providers';
import { ForceUpdateGate } from '@/providers/force-update-gate';
import { useBootstrap } from '@/providers/use-bootstrap';
import { useLocationStore, useSessionStore } from '@/stores';
import { colors } from '@/theme';

export default function RootLayout() {
  const ready = useBootstrap();
  if (!ready) return null; // native splash stays visible until bootstrap finishes

  return (
    <AppProviders>
      <StatusBar style="dark" />
      <ForceUpdateGate>
        <RootStack />
      </ForceUpdateGate>
      <ToastHost />
    </AppProviders>
  );
}

function RootStack() {
  const status = useSessionStore((s) => s.status);
  const hasLocation = useLocationStore((s) => s.location !== null);
  // Main app needs a location and either a guest or a verified session (Screen Flow → A).
  const onboarded = hasLocation && (status === 'guest' || status === 'authenticated');

  return (
    <Stack
      screenOptions={{
        headerShown: false,
        contentStyle: { backgroundColor: colors.surface.page },
        headerStyle: { backgroundColor: colors.surface.page },
        headerTintColor: colors.text.primary,
        headerShadowVisible: false,
        headerBackButtonDisplayMode: 'minimal', // never show a route-group name like "(main)"
      }}>
      <Stack.Protected guard={!onboarded}>
        <Stack.Screen name="(auth)" />
      </Stack.Protected>
      <Stack.Protected guard={onboarded}>
        <Stack.Screen name="(main)" />
      </Stack.Protected>
      {/* Location screens are reachable both during onboarding and from Home. */}
      <Stack.Screen name="locating" options={{ animation: 'fade' }} />
      <Stack.Screen name="location-search" options={{ headerShown: true, title: 'Search location' }} />
      <Stack.Screen name="dev-gallery" options={{ headerShown: true, title: 'Components' }} />
    </Stack>
  );
}
