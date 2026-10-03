import { Stack } from 'expo-router';

import { colors } from '@/theme';

/**
 * Everything after onboarding: the tab bar plus screens pushed over it. Checkout lives here
 * (not inside a tab), so Back always returns to whichever screen opened it.
 */
export default function MainLayout() {
  return (
    <Stack
      screenOptions={{
        headerBackButtonDisplayMode: 'minimal',
        headerStyle: { backgroundColor: colors.surface.page },
        headerTintColor: colors.text.primary,
        headerShadowVisible: false,
        contentStyle: { backgroundColor: colors.surface.page },
      }}>
      <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
      <Stack.Screen name="service/[slug]" options={{ title: '' }} />
      <Stack.Screen name="cart" options={{ title: 'Cart' }} />
      <Stack.Screen
        name="schedule"
        // A page-sheet modal, not `formSheet`: in a form sheet the scroll content laid out blank on
        // iOS 26 (react-native-screens 4.26). The screen draws its own title.
        options={{ headerShown: false, presentation: 'modal' }}
      />
      <Stack.Screen name="recurring" options={{ title: 'Weekly plan' }} />
      <Stack.Screen name="address-form" options={{ title: 'Add address' }} />
      <Stack.Screen name="checkout" options={{ title: 'Payment options' }} />
      <Stack.Screen name="offers" options={{ title: 'Offers' }} />
      <Stack.Screen name="payment-result" options={{ headerShown: false, gestureEnabled: false }} />
      <Stack.Screen name="pass" options={{ title: 'ChoreDash Pass' }} />
      <Stack.Screen name="gift-card" options={{ title: 'Claim a gift card' }} />
      <Stack.Screen name="transactions" options={{ title: 'Transaction history' }} />
      <Stack.Screen name="bookings/[id]" options={{ title: 'Booking' }} />
      <Stack.Screen name="reschedule" options={{ title: 'Reschedule', presentation: 'modal' }} />
      <Stack.Screen name="support" options={{ title: 'Help & support' }} />
      <Stack.Screen name="referral" options={{ title: 'Refer & earn' }} />
      <Stack.Screen name="change-location" options={{ title: 'Change location', presentation: 'modal' }} />
      <Stack.Screen name="profile" options={{ headerShown: false }} />
      {/* Full screen like first-run A7, so the brand header always sits under the status bar. */}
      <Stack.Screen name="login-modal" options={{ headerShown: false, presentation: 'fullScreenModal' }} />
    </Stack>
  );
}
