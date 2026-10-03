// Runs before every test file.
// Mock API answers instantly in tests.
process.env.EXPO_PUBLIC_MOCK_LATENCY_MS = '0';

jest.mock('@react-native-async-storage/async-storage', () =>
  require('@react-native-async-storage/async-storage/jest/async-storage-mock'),
);
jest.mock('expo-symbols', () => ({ SymbolView: () => null }));
jest.mock('expo-secure-store', () => {
  const store = new Map<string, string>();
  return {
    getItemAsync: async (k: string) => store.get(k) ?? null,
    setItemAsync: async (k: string, v: string) => void store.set(k, v),
    deleteItemAsync: async (k: string) => void store.delete(k),
  };
});
// Unique per call, like the real thing — a constant key would make the mock replay unrelated requests.
let mockUuidCount = 0;
jest.mock('expo-crypto', () => ({ randomUUID: () => `test-uuid-${++mockUuidCount}` }));
// Reanimated 4 runs worklets natively; use the JS mocks both libraries ship for Jest.
jest.mock('react-native-worklets', () => require('react-native-worklets/src/mock'));
jest.mock('react-native-reanimated', () => ({
  ...require('react-native-reanimated/mock'),
  useReducedMotion: () => false, // missing from the shipped mock
}));
