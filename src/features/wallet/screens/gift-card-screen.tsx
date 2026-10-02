import { router } from 'expo-router';
import { useState } from 'react';
import { View } from 'react-native';

import { Button, Input, Screen, StickyFooter, Text } from '@/components/ui';
import { useErrorMessage } from '@/lib/i18n';

import { useRedeemGiftCard } from '../hooks/use-wallet';

const STEPS = [
  'Enter the code from your gift card.',
  'Tap Apply.',
  'The amount is added to your wallet at once.',
];

/** Codes are shown and sent uppercase without spaces, however they were typed (F3). */
const normalise = (v: string) => v.toUpperCase().replace(/\s+/g, '');

/** F3 Claim a gift card (CD-054). */
export function GiftCardScreen() {
  const [code, setCode] = useState('');
  const redeem = useRedeemGiftCard();
  const errorMessage = useErrorMessage();

  const apply = () =>
    redeem.mutate(code, {
      onSuccess: () => router.back(),
    });

  return (
    <Screen
      edges={[]}
      testID="F3"
      footer={
        <StickyFooter>
          <Button
            title="Apply"
            size="lg"
            fullWidth
            disabled={code.length < 4}
            loading={redeem.isPending}
            onPress={apply}
          />
        </StickyFooter>
      }>
      <Input
        label="Gift voucher code"
        placeholder="e.g. CHOREDASH100"
        value={code}
        onChangeText={(v) => {
          setCode(normalise(v));
          if (redeem.isError) redeem.reset();
        }}
        autoCapitalize="characters"
        autoCorrect={false}
        autoFocus
        maxLength={32}
        error={redeem.isError ? errorMessage(redeem.error) : null}
        onSubmitEditing={apply}
      />
      <View className="gap-2">
        <Text variant="h3">How it works</Text>
        {STEPS.map((s, i) => (
          <Text key={s} tone="muted">
            {i + 1}. {s}
          </Text>
        ))}
      </View>
    </Screen>
  );
}
