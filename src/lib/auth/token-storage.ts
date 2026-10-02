import type { AuthTokens } from '@/api/types';
import { secureStorage } from '@/lib/storage/secure-storage';

const KEY = 'auth.tokens';

// Kept in memory after the first read so every request doesn't hit the Keychain.
let cache: AuthTokens | null | undefined;

export const tokenStorage = {
  async get(): Promise<AuthTokens | null> {
    if (cache !== undefined) return cache;
    const raw = await secureStorage.get(KEY);
    cache = raw ? (JSON.parse(raw) as AuthTokens) : null;
    return cache;
  },
  async set(tokens: AuthTokens) {
    cache = tokens;
    await secureStorage.set(KEY, JSON.stringify(tokens));
  },
  async clear() {
    cache = null;
    await secureStorage.remove(KEY);
  },
};
