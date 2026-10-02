import { Stack } from 'expo-router';

import { colors } from '@/theme';

/** Profile stack (H1–H11), opened from the Home header icon. */
export default function ProfileLayout() {
  return (
    <Stack
      screenOptions={{
        headerBackButtonDisplayMode: 'minimal',
        headerStyle: { backgroundColor: colors.surface.page },
        headerTintColor: colors.text.primary,
        headerShadowVisible: false,
        contentStyle: { backgroundColor: colors.surface.page },
      }}>
      <Stack.Screen name="index" options={{ title: 'Profile' }} />
      <Stack.Screen name="edit" options={{ title: 'Profile details' }} />
      <Stack.Screen name="bookings" options={{ title: 'My Bookings' }} />
      <Stack.Screen name="addresses" options={{ title: 'My addresses' }} />
      <Stack.Screen name="delete-account" options={{ title: 'Delete account' }} />
    </Stack>
  );
}
