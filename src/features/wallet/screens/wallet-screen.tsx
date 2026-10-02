import { router } from 'expo-router';
import { View } from 'react-native';

import {
  Icon,
  icons,
  ListGroup,
  ListRow,
  Screen,
  Skeleton,
  StateView,
  Text,
  type IconName,
} from '@/components/ui';

import { AddMoney } from '../components/add-money';
import { BalanceCard } from '../components/balance-card';
import { useWallet } from '../hooks/use-wallet';

const HOW_IT_WORKS: { title: string; body: string; icon: IconName }[] = [
  { title: 'Earn rewards', body: 'Get extra reward balance when you add money.', icon: icons.gift },
  {
    title: 'Quick checkout',
    body: 'Pay for bookings in one tap from your balance.',
    icon: { ios: 'bolt', android: 'bolt', web: 'bolt' },
  },
  {
    title: 'Use it on every service',
    body: 'Balance works across all ChoreDash services.',
    icon: icons.check,
  },
];

/** F1–F2 ChoreDash Money (CD-052). */
export function WalletScreen() {
  const wallet = useWallet();

  if (wallet.isError) return <StateView state="error" error={wallet.error} onRetry={wallet.refetch} />;

  return (
    <Screen testID="F1" onRefresh={wallet.refetch} refreshing={wallet.isRefetching}>
      <Text variant="h1">ChoreDash Money</Text>
      {wallet.isPending ? (
        <View className="gap-4">
          <Skeleton height={170} rounded="hero" />
          <Skeleton height={260} rounded="card" />
        </View>
      ) : (
        <>
          <BalanceCard wallet={wallet.data} />
          <AddMoney wallet={wallet.data} />
          <ListGroup>
            <ListRow title="Claim a gift card" icon={icons.gift} onPress={() => router.push('/gift-card')} />
            <ListRow
              title="Transaction history"
              icon={{ ios: 'list.bullet.rectangle', android: 'receipt_long', web: 'receipt_long' }}
              onPress={() => router.push('/transactions')}
            />
          </ListGroup>
          <ListGroup title="How it works">
            {HOW_IT_WORKS.map((h) => (
              <View key={h.title} className="flex-row items-start gap-3 px-4 py-3">
                <View className="h-9 w-9 items-center justify-center rounded-chip bg-muted">
                  <Icon name={h.icon} size={18} />
                </View>
                <View className="flex-1 gap-0.5">
                  <Text weight="medium">{h.title}</Text>
                  <Text variant="caption" tone="muted">
                    {h.body}
                  </Text>
                </View>
              </View>
            ))}
          </ListGroup>
          <Text variant="caption" tone="muted" className="px-1 pb-4">
            Reward balance expires {wallet.data.promoExpiryDays} days after it&apos;s credited; cash balance
            after {Math.round(wallet.data.cashExpiryDays / 365)} year. Balance can&apos;t be withdrawn or
            transferred and can only be used on ChoreDash.
          </Text>
        </>
      )}
    </Screen>
  );
}
