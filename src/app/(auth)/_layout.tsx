import { Stack } from 'expo-router';

import { useSessionStore } from '@/stores';

/** Onboarding stack: log in (or skip) first, then fetch the location (A3–A4); the root then shows Home. */
export default function AuthLayout() {
  const status = useSessionStore((s) => s.status);
  const signedIn = status === 'guest' || status === 'authenticated';
  const offerReferral = useSessionStore((s) => s.offerReferral);
  return (
    <Stack screenOptions={{ headerShown: false }}>
      <Stack.Protected guard={!signedIn}>
        <Stack.Screen name="login" />
        <Stack.Screen name="otp" />
      </Stack.Protected>
      {/* New accounts: "Have a referral code?" once, before fetching the location. */}
      <Stack.Protected guard={signedIn && offerReferral}>
        <Stack.Screen name="referral-code" options={{ animation: 'fade' }} />
      </Stack.Protected>
      <Stack.Protected guard={signedIn && !offerReferral}>
        <Stack.Screen name="fetch-location" options={{ animation: 'fade' }} />
      </Stack.Protected>
    </Stack>
  );
}
