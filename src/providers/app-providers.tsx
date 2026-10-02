import { PersistQueryClientProvider } from '@tanstack/react-query-persist-client';
import type { ReactNode } from 'react';
import { GestureHandlerRootView } from 'react-native-gesture-handler';

import { queryClient, queryPersister } from '@/api';
import '@/lib/i18n';
import './app-focus';

const DAY = 24 * 60 * 60_000;

/** Every app-wide provider, in one place, so the root layout stays about routing. */
export function AppProviders({ children }: { children: ReactNode }) {
  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <PersistQueryClientProvider
        client={queryClient}
        persistOptions={{
          persister: queryPersister,
          maxAge: DAY,
          // Bump when cached response shapes or fixtures change, so old caches are dropped on launch.
          buster: 'cache-2',
          // Only queries that opt in (`meta: { persist: true }`) are saved to disk.
          dehydrateOptions: {
            shouldDehydrateQuery: (q) => q.meta?.persist === true && q.state.status === 'success',
          },
        }}>
        {children}
      </PersistQueryClientProvider>
    </GestureHandlerRootView>
  );
}
