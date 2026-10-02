import { focusManager } from '@tanstack/react-query';
import { AppState, Platform } from 'react-native';

/**
 * React Native has no window focus: tell TanStack Query when the app comes to the foreground, so
 * stale queries (config, bookings, wallet) refetch then (TanStack Query → React Native guide).
 */
focusManager.setEventListener((setFocused) => {
  const sub = AppState.addEventListener('change', (state) => {
    if (Platform.OS !== 'web') setFocused(state === 'active');
  });
  return () => sub.remove();
});
