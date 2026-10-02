import { Stack } from 'expo-router';

import { useLocationStore } from '@/stores';

/** Onboarding stack (A2–A11): location first, then login. */
export default function AuthLayout() {
  const hasLocation = useLocationStore((s) => s.location !== null);
  return (
    <Stack screenOptions={{ headerShown: false }}>
      <Stack.Protected guard={!hasLocation}>
        <Stack.Screen name="location" />
      </Stack.Protected>
      <Stack.Screen name="login" />
      <Stack.Screen name="otp" options={{ headerShown: true, title: '', headerTransparent: true }} />
    </Stack>
  );
}
