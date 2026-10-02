import { randomUUID } from 'expo-crypto';

/**
 * Idempotency-Key for money-moving writes (create booking, payment, top-up).
 * Generate once per user action (e.g. in the tap handler) and reuse it on retry.
 */
export const newIdempotencyKey = () => randomUUID();
