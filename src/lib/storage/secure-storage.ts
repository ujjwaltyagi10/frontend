// Keychain (iOS) / Keystore (Android) storage. The only place tokens may be written
// (Security doc → Mobile app security: never AsyncStorage or MMKV).
import * as SecureStore from 'expo-secure-store';

export const secureStorage = {
  get: (key: string) => SecureStore.getItemAsync(key),
  set: (key: string, value: string) => SecureStore.setItemAsync(key, value),
  remove: (key: string) => SecureStore.deleteItemAsync(key),
};
