// Saves the mock backend's in-memory state to device storage, so bookings, wallet, Pass,
// addresses and the signed-in user survive app reloads (like a real server would). Each module
// registers what it owns; POST /dev/mock/reset wipes everything back to the fixtures.
import { kvStorage } from '@/lib/storage/kv-storage';

const KEY = 'mock-backend-v1';
// Tests stay isolated: no snapshot is read or written under Jest.
const ENABLED = process.env.NODE_ENV !== 'test';

type Part = { save: () => unknown; load: (value: unknown) => void; reset: () => void };
const parts = new Map<string, Part>();
/** The last snapshot read or written — hot reload re-registers parts after restoreOnce has run. */
let snapshot: Record<string, unknown> | null = null;

export function persisted(name: string, part: Part) {
  parts.set(name, part);
  // A handler file hot-reloaded in development registers a fresh, empty part. Fill it from the
  // last snapshot, or the next save would write that empty state over the user's data.
  if (snapshot && name in snapshot) part.load(snapshot[name]);
}

let restored: Promise<void> | null = null;

/** Loads the saved state once, before the first mock request is answered. */
export function restoreOnce(): Promise<void> {
  restored ??= (async () => {
    if (!ENABLED) return;
    try {
      const raw = await kvStorage.getItem(KEY);
      if (!raw) return;
      const saved = JSON.parse(raw) as Record<string, unknown>;
      snapshot = saved;
      for (const [name, part] of parts) if (name in saved) part.load(saved[name]);
    } catch {
      // Corrupt or old snapshot: start from the fixtures.
    }
  })();
  return restored;
}

let timer: ReturnType<typeof setTimeout> | null = null;

/** Debounced save after any request that may have changed state. */
export function scheduleSave() {
  if (!ENABLED) return;
  if (timer) clearTimeout(timer);
  timer = setTimeout(() => {
    timer = null;
    // Round-trip through JSON so the kept snapshot can't share objects with live state.
    const json = JSON.stringify(Object.fromEntries([...parts].map(([name, part]) => [name, part.save()])));
    snapshot = JSON.parse(json) as Record<string, unknown>;
    void kvStorage.setItem(KEY, json).catch(() => undefined);
  }, 300);
}

export async function resetAll() {
  snapshot = null;
  for (const part of parts.values()) part.reset();
  await kvStorage.removeItem(KEY);
}

// Helpers for the common shapes.
export const mapPart = <V>(map: Map<string, V>): Part => ({
  save: () => [...map.entries()],
  load: (v) => {
    map.clear();
    for (const [k, val] of v as [string, V][]) map.set(k, val);
  },
  reset: () => map.clear(),
});

export const setPart = (set: Set<string>): Part => ({
  save: () => [...set],
  load: (v) => {
    set.clear();
    for (const x of v as string[]) set.add(x);
  },
  reset: () => set.clear(),
});
