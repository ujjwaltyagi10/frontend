import Constants from 'expo-constants';
import * as Device from 'expo-device';
import * as Notifications from 'expo-notifications';
import { router, type Href } from 'expo-router';
import { useEffect } from 'react';
import { Platform } from 'react-native';

import { api } from '@/api';
import { env } from '@/config/env';
import { useSessionStore } from '@/stores';

// Show notifications that arrive while the app is open, too.
Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowBanner: true,
    shouldShowList: true,
    shouldPlaySound: true,
    shouldSetBadge: false,
  }),
});

/**
 * Asks once for permission and sends this device's Expo push token to the server. Quietly does
 * nothing in mock mode, on simulators, in Expo Go builds without an EAS project id, or if the user
 * says no (they can turn it on later in system settings; we try again next launch).
 */
async function register(): Promise<void> {
  if (env.useMocks || !Device.isDevice) return;
  const projectId = Constants.expoConfig?.extra?.eas?.projectId as string | undefined;
  if (!projectId) return;
  if (Platform.OS === 'android')
    await Notifications.setNotificationChannelAsync('default', {
      name: 'Bookings and wallet',
      importance: Notifications.AndroidImportance.HIGH,
    });
  let { status } = await Notifications.getPermissionsAsync();
  if (status !== 'granted') ({ status } = await Notifications.requestPermissionsAsync());
  if (status !== 'granted') return;
  const { data: token } = await Notifications.getExpoPushTokenAsync({ projectId });
  await api.profile.registerDevice(token, Platform.OS === 'ios' ? 'ios' : 'android');
}

/** Opens the screen a notification points at (data.url, e.g. /bookings/<id>). */
function open(response: Notifications.NotificationResponse | null) {
  const url = response?.notification.request.content.data?.url;
  if (typeof url === 'string' && url.startsWith('/')) router.push(url as Href);
}

/**
 * Mount once inside the signed-in app: registers for push when a customer is logged in, and routes
 * notification taps (including the one that launched the app).
 */
export function usePushNotifications() {
  const signedIn = useSessionStore((s) => s.status === 'authenticated');

  useEffect(() => {
    if (signedIn) register().catch(() => undefined); // never block the app on push
  }, [signedIn]);

  useEffect(() => {
    open(Notifications.getLastNotificationResponse());
    const sub = Notifications.addNotificationResponseReceivedListener(open);
    return () => sub.remove();
  }, []);
}
