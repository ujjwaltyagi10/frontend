import { Image } from 'expo-image';
import { View } from 'react-native';

import type { WalletSummary } from '@/api';
import { illustrations } from '@/components/illustrations';
import { Text } from '@/components/ui';
import { formatMoney } from '@/lib/format';

/** F1 header: total, the cash / rewards split (rewards expire sooner) and a low-balance nudge (WL-1). */
export function BalanceCard({ wallet }: { wallet: WalletSummary }) {
  return (
    <View
      className="items-center gap-4 rounded-hero bg-primary-deep px-4 pb-4 pt-5"
      accessible
      accessibilityLabel={`Wallet balance ${formatMoney(wallet.totalPaise)}. Cash ${formatMoney(
        wallet.cashBalancePaise,
      )}, rewards ${formatMoney(wallet.promoBalancePaise)}`}>
      <View className="items-center">
        <View className="mb-2 h-16 w-16 items-center justify-center rounded-pill bg-card">
          <Image source={illustrations.wallet} style={{ width: 44, height: 44 }} accessible={false} />
        </View>
        <Text variant="display" tone="onPrimary">
          {formatMoney(wallet.totalPaise)}
        </Text>
        <Text variant="caption" tone="onPrimaryMuted">
          Available balance
        </Text>
      </View>
      <View className="flex-row items-center self-stretch rounded-card bg-card/15 py-3">
        <Split label="Cash" value={formatMoney(wallet.cashBalancePaise)} />
        <View className="h-8 w-px bg-on-primary-muted/40" />
        <Split label="Rewards" value={formatMoney(wallet.promoBalancePaise)} />
      </View>
      {wallet.lowBalance && (
        <Text variant="caption" tone="onPrimaryMuted" className="px-2 text-center">
          Add money for one-tap checkout on your next booking.
        </Text>
      )}
    </View>
  );
}

function Split({ label, value }: { label: string; value: string }) {
  return (
    <View className="flex-1 items-center gap-0.5">
      <Text variant="micro" tone="onPrimaryMuted" className="uppercase">
        {label}
      </Text>
      <Text weight="semibold" tone="onPrimary">
        {value}
      </Text>
    </View>
  );
}
