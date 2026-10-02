import { View } from 'react-native';

import type { WalletSummary } from '@/api';
import { Icon, icons, Text } from '@/components/ui';
import { formatMoney } from '@/lib/format';
import { colors } from '@/theme';

/** F1 header: total, the cash / rewards split (rewards expire sooner) and a low-balance nudge (WL-1). */
export function BalanceCard({ wallet }: { wallet: WalletSummary }) {
  return (
    <View
      className="gap-4 rounded-hero border border-line bg-card p-5"
      accessibilityLabel={`Wallet balance ${formatMoney(wallet.totalPaise)}`}>
      <View className="gap-1">
        <Text variant="caption" tone="muted">
          Wallet balance
        </Text>
        <Text variant="display" tone="brand">
          {formatMoney(wallet.totalPaise)}
        </Text>
      </View>
      <View className="flex-row rounded-card border border-line bg-card">
        <Split label="Cash" value={formatMoney(wallet.cashBalancePaise)} />
        <View className="my-3 w-px bg-line" />
        <Split label="Rewards" value={formatMoney(wallet.promoBalancePaise)} />
      </View>
      {wallet.lowBalance && (
        <View className="flex-row items-center gap-2">
          <Icon name={icons.info} size={14} color={colors.brand.primaryStrong} />
          <Text variant="caption" tone="accent" className="flex-1">
            Add money for one-tap checkout on your next booking.
          </Text>
        </View>
      )}
    </View>
  );
}

function Split({ label, value }: { label: string; value: string }) {
  return (
    <View className="flex-1 gap-0.5 px-4 py-3">
      <Text variant="micro" tone="muted" className="uppercase">
        {label}
      </Text>
      <Text weight="semibold">{value}</Text>
    </View>
  );
}
