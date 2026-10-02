import { randomUUID } from 'expo-crypto';

import { kvStorage } from '@/lib/storage/kv-storage';

const KEY = 'device-id';
let cached: Promise<string> | undefined;

/** A random per-install ID (not a hardware ID). Survives restarts; reset by reinstalling. */
export function getDeviceId(): Promise<string> {
  cached ??= (async () => {
    const existing = await kvStorage.getItem(KEY);
    if (existing) return existing;
    const id = randomUUID();
    await kvStorage.setItem(KEY, id);
    return id;
  })();
  return cached;
}
