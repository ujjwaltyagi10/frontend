import { FlashList } from '@shopify/flash-list';
import { View } from 'react-native';

import type { WalletTransaction } from '@/api';
import { Badge, EmptyState, SkeletonText, StateView, Text } from '@/components/ui';
import { formatDay, formatMoney, formatTime } from '@/lib/format';

import { useWalletTransactions } from '../hooks/use-wallet';

const STATUS = {
  pending: { label: 'Pending', tone: 'neutral' },
  success: { label: 'Success', tone: 'success' },
  failed: { label: 'Failed', tone: 'danger' },
} as const;

/** F7 Transaction history (CD-053): cursor-paged, pending rows refresh every 10 s. */
export function TransactionsScreen() {
  const tx = useWalletTransactions();

  if (tx.isPending)
    return (
      <View className="flex-1 bg-page p-4">
        <SkeletonText lines={8} />
      </View>
    );
  if (tx.isError) return <StateView state="error" error={tx.error} onRetry={tx.refetch} />;

  const items = tx.data.pages.flatMap((p) => p.items);
  return (
    <View className="flex-1 bg-page" testID="F7">
      <FlashList
        data={items}
        keyExtractor={(t) => t.id}
        renderItem={({ item }) => <Row t={item} />}
        contentContainerStyle={{ padding: 16 }}
        onEndReached={() => tx.hasNextPage && !tx.isFetchingNextPage && tx.fetchNextPage()}
        onRefresh={tx.refetch}
        refreshing={tx.isRefetching && !tx.isFetchingNextPage}
        ListEmptyComponent={
          <EmptyState title="No transactions yet" message="Money you add or spend will show here." />
        }
      />
    </View>
  );
}

function Row({ t }: { t: WalletTransaction }) {
  const s = STATUS[t.status];
  const credit = t.direction === 'credit';
  return (
    <View className="flex-row items-center gap-3 border-b border-line py-3">
      <View className="flex-1 gap-0.5">
        <Text weight="semibold">{t.title}</Text>
        <Text variant="caption" tone="muted">
          {formatDay(t.createdAt)}, {formatTime(t.createdAt)}
          {t.bucket === 'promo' && t.expiresAt ? ` · expires ${formatDay(t.expiresAt)}` : ''}
        </Text>
      </View>
      <View className="items-end gap-1">
        <Text weight="semibold" tone={credit && t.status === 'success' ? 'success' : 'default'}>
          {credit ? '+' : '−'}
          {formatMoney(t.amountPaise)}
        </Text>
        <Badge label={s.label} tone={s.tone} />
      </View>
    </View>
  );
}
