import { Platform } from 'react-native';

import type { AnalyticsEvents } from './events';

export type { AnalyticsEvents } from './events';

type QueuedEvent = { name: string; props: object; at: string; platform: string };

const queue: QueuedEvent[] = [];
const FLUSH_AT = 20;

/**
 * Queue an event. Batches are sent to the backend events endpoint (CD-086); until then they're
 * logged in development. Common props (session_id, app_version, city_id) get added at flush.
 */
export function track<E extends keyof AnalyticsEvents>(name: E, props: AnalyticsEvents[E]) {
  queue.push({ name, props, at: new Date().toISOString(), platform: Platform.OS });
  if (__DEV__) console.log(`[analytics] ${name}`, props);
  if (queue.length >= FLUSH_AT) void flush();
}

export async function flush() {
  const batch = queue.splice(0, queue.length);
  if (batch.length === 0) return;
  // TODO(CD-086): POST batch to the analytics endpoint.
}
