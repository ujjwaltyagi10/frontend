import { router } from 'expo-router';
import { useState } from 'react';
import { View } from 'react-native';

import type { WalletSummary } from '@/api';
import { Badge, Button, Card, Chip, Input, Text } from '@/components/ui';
import { track } from '@/lib/analytics';
import { formatMoney } from '@/lib/format';

import { parseRupees, previewBonus, validateTopup } from '../logic/topup';

/** F1 Add money: amount, ₹250 / ₹500 / ₹1000 presets with their bonus, live bonus line (WL-2). */
export function AddMoney({ wallet }: { wallet: WalletSummary }) {
  const rules = wallet.topup;
  const [text, setText] = useState('');
  const amount = parseRupees(text);
  const error = validateTopup(amount, rules);
  const bonus = amount ? previewBonus(amount, rules) : 0;
  const canAdd = amount !== null && !error;

  const add = () => {
    if (!canAdd) return;
    track('wallet_topup_started', { amount, bonus });
    router.push({ pathname: '/checkout', params: { purpose: 'topup', amountPaise: String(amount) } });
  };

  return (
    <Card className="gap-4">
      <View className="flex-row items-center justify-between">
        <Text variant="h3">Add money</Text>
        <Badge label={`${rules.bonus.bps / 100}% EXTRA ON ${formatMoney(rules.bonus.minPaise)}+`} />
      </View>
      <Input
        value={text}
        onChangeText={(v) => setText(v.replace(/\D/g, '').slice(0, 6))}
        keyboardType="number-pad"
        placeholder="Enter amount"
        accessibilityLabel="Amount to add in rupees"
        prefix={<Text weight="semibold">₹</Text>}
        error={error}
      />
      <View className="flex-row gap-2">
        {rules.presetsPaise.map((p) => {
          const b = previewBonus(p, rules);
          return (
            <View key={p} className="flex-1">
              <Chip
                label={formatMoney(p)}
                sublabel={b ? `+${formatMoney(b)} bonus` : undefined}
                selected={amount === p}
                onPress={() => setText(String(p / 100))}
              />
            </View>
          );
        })}
      </View>
      {bonus > 0 && (
        <Text variant="caption" weight="semibold" tone="success">
          You get {formatMoney(amount!)} + {formatMoney(bonus)} bonus rewards
        </Text>
      )}
      <Button
        title={canAdd ? `Add ${formatMoney(amount!)}` : 'Add money'}
        size="lg"
        fullWidth
        disabled={!canAdd}
        onPress={add}
      />
    </Card>
  );
}
