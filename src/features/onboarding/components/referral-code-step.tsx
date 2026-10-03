import { useMutation, useQueryClient } from '@tanstack/react-query';
import { useState } from 'react';
import { View } from 'react-native';

import { api, queryKeys } from '@/api';
import { Button, Input, Text } from '@/components/ui';
import { track } from '@/lib/analytics';
import { formatMoney } from '@/lib/format';
import { useErrorMessage, useTranslation } from '@/lib/i18n';
import { newIdempotencyKey } from '@/lib/ids';

/**
 * A9 for new accounts: "Have a referral code?" once, right after OTP. A valid friend's code adds
 * ₹50 to ChoreDash Money; skipping is always fine. `onDone` moves on either way.
 */
export function ReferralCodeStep({ onDone }: { onDone: () => void }) {
  const { t } = useTranslation('onboarding');
  const errorMessage = useErrorMessage();
  const qc = useQueryClient();
  const [code, setCode] = useState('');
  const [key] = useState(newIdempotencyKey);
  const redeem = useMutation({
    mutationFn: (c: string) => api.referral.redeem(c, key),
    onSuccess: (r) => {
      qc.setQueryData(queryKeys.wallet, r.wallet);
      track('referral_redeemed', { amount: r.creditedPaise });
    },
  });
  const clean = code.trim().toUpperCase().replace(/\s+/g, '');

  if (redeem.isSuccess)
    return (
      <View className="gap-4">
        <View className="items-center gap-1">
          <Text variant="h2" className="text-center">
            {t('referral.added', { amount: formatMoney(redeem.data.creditedPaise) })}
          </Text>
          <Text tone="muted" className="text-center">
            {t('referral.addedSub')}
          </Text>
        </View>
        <Button title={t('referral.continue')} size="lg" fullWidth onPress={onDone} />
      </View>
    );

  return (
    <View className="gap-4">
      <View className="items-center gap-1">
        <Text variant="h2" className="text-center">
          {t('referral.title')}
        </Text>
        <Text tone="muted" className="text-center">
          {t('referral.subtitle')}
        </Text>
      </View>
      <Input
        label={t('referral.label')}
        placeholder={t('referral.placeholder')}
        value={code}
        onChangeText={(v) => {
          setCode(v);
          if (redeem.isError) redeem.reset();
        }}
        autoCapitalize="characters"
        autoCorrect={false}
        returnKeyType="done"
        onSubmitEditing={() => clean && redeem.mutate(clean)}
        error={redeem.isError ? errorMessage(redeem.error) : null}
      />
      <Button
        title={t('referral.apply')}
        size="lg"
        fullWidth
        disabled={!clean}
        loading={redeem.isPending}
        onPress={() => redeem.mutate(clean)}
      />
      <Button title={t('referral.skip')} variant="link" className="self-center" onPress={onDone} />
    </View>
  );
}
