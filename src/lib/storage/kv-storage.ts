// Non-sensitive key-value storage for caches and persisted client state.
// Backed by AsyncStorage so it runs in Expo Go; the spec targets MMKV, which needs a
// development build — swap the implementation here and nothing else changes.
import AsyncStorage from '@react-native-async-storage/async-storage';
import { createJSONStorage, type StateStorage } from 'zustand/middleware';

export const kvStorage = {
  getItem: (key: string) => AsyncStorage.getItem(key),
  setItem: (key: string, value: string) => AsyncStorage.setItem(key, value),
  removeItem: (key: string) => AsyncStorage.removeItem(key),
  clear: () => AsyncStorage.clear(),
} satisfies StateStorage & { clear: () => Promise<void> };

/** Storage adapter for `zustand/middleware` `persist`. */
export const zustandStorage = createJSONStorage(() => kvStorage);
