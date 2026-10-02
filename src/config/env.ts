// Every runtime setting the app reads from the environment, parsed once and typed.
// Only `EXPO_PUBLIC_*` variables are inlined into the bundle, so nothing here may be secret.
import { z } from 'zod';

const schema = z.object({
  appEnv: z.enum(['development', 'staging', 'production']).default('development'),
  apiUrl: z.string().url().default('https://api.example.com/v1'),
  useMocks: z
    .enum(['true', 'false'])
    .default('true')
    .transform((v) => v === 'true'),
  mockLatencyMs: z.coerce.number().int().min(0).default(600),
});

export const env = schema.parse({
  appEnv: process.env.EXPO_PUBLIC_APP_ENV || undefined,
  apiUrl: process.env.EXPO_PUBLIC_API_URL || undefined,
  useMocks: process.env.EXPO_PUBLIC_USE_MOCKS || undefined,
  mockLatencyMs: process.env.EXPO_PUBLIC_MOCK_LATENCY_MS || undefined,
});

export type Env = typeof env;
