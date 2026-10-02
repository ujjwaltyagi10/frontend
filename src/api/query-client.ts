import { createAsyncStoragePersister } from '@tanstack/query-async-storage-persister';
import { QueryClient } from '@tanstack/react-query';

import { kvStorage } from '@/lib/storage/kv-storage';

import { isApiError } from './errors';

export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 30_000,
      gcTime: 24 * 60 * 60_000, // must be ≥ persister maxAge for persisted queries to survive
      retry: (failureCount, error) => {
        // Don't retry client errors (bad input, auth, not found) — only network/5xx.
        if (isApiError(error) && error.status >= 400 && error.status < 500) return false;
        return failureCount < 2;
      },
    },
    mutations: { retry: false },
  },
});

/**
 * Persists the query cache so Home renders instantly on cold start.
 * Only queries with `meta: { persist: true }` are written (see PersistQueryClientProvider).
 */
export const queryPersister = createAsyncStoragePersister({
  storage: kvStorage,
  key: 'query-cache',
  throttleTime: 1000,
});
