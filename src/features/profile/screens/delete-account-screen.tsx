import { router } from 'expo-router';
import { useState } from 'react';
import { View } from 'react-native';

import { Banner, Button, OtpInput, Screen, Skeleton, StickyFooter, Text } from '@/components/ui';
import { formatMoney, formatPhone } from '@/lib/format';
import { useErrorMessage } from '@/lib/i18n';
import { useSessionStore } from '@/stores';

import { useDeleteAccount, useDeletionCheck, useSendDeletionOtp } from '../hooks/use-me';

const whatHappens = (days: number) => [
  `Your account is scheduled for deletion and you are logged out on every device.`,
  `Changed your mind? Just log in again within ${days} days and everything is restored.`,
  `After ${days} days your name, phone number, email and saved addresses are erased for good.`,
  'Past booking amounts and dates are kept without your name, as tax law requires.',
];

/**
 * H10 Delete account (CD-067, PF-6): in-app, confirmed by OTP, with a 30-day grace period. Before
 * anything is sent it warns, with the exact amount, that ChoreDash Money and an active Pass will be
 * wiped out (closed-loop money can't be withdrawn), and an open booking blocks deletion.
 */
export function DeleteAccountScreen() {
  const phone = useSessionStore((s) => s.user?.phone ?? '');
  const check = useDeletionCheck();
  const sendOtp = useSendDeletionOtp();
  const remove = useDeleteAccount();
  const errorMessage = useErrorMessage();
  const [otp, setOtp] = useState('');

  const confirm = (code: string) => remove.mutate(code, { onError: () => setOtp('') });

  const c = check.data;
  const blocked = c?.canDelete === false;
  const losesMoney = !!c && c.balancePaise > 0;
  const sent = sendOtp.isSuccess;
  const days = c?.graceDays ?? 30;

  return (
    <Screen
      edges={[]}
      testID="H10"
      footer={
        <StickyFooter>
          {blocked ? (
            <Button title="Contact support" size="lg" fullWidth onPress={() => router.push('/support')} />
          ) : sent ? (
            <Button
              title={losesMoney ? `Delete account and lose ${formatMoney(c.balancePaise)}` : 'Delete my account'}
              variant="destructive"
              size="lg"
              fullWidth
              disabled={otp.length !== 6}
              loading={remove.isPending}
              onPress={() => confirm(otp)}
            />
          ) : (
            <Button
              title="Send OTP to confirm"
              variant="destructive"
              size="lg"
              fullWidth
              disabled={!c}
              loading={sendOtp.isPending}
              onPress={() => sendOtp.mutate(phone)}
            />
          )}
        </StickyFooter>
      }>
      <Text variant="h2">Delete your account?</Text>

      {check.isPending ? (
        <Skeleton height={72} rounded="card" />
      ) : check.isError ? (
        <Banner tone="warning" title={errorMessage(check.error)} />
      ) : blocked ? (
        <Banner
          tone="warning"
          title="You have an upcoming or ongoing booking"
          message="Your account can be deleted once it's completed or cancelled. Contact support if you need help."
        />
      ) : (
        (losesMoney || c?.passActive) && (
          <Banner
            tone="danger"
            title={
              losesMoney
                ? `${formatMoney(c!.balancePaise)} in ChoreDash Money will be wiped out`
                : 'Your ChoreDash Pass will be wiped out'
            }
            message={`ChoreDash Money${c?.passActive ? ' and your active Pass' : ''} can't be refunded, withdrawn or moved to another account. Use it on a booking before deleting.`}
          />
        )
      )}

      <View className="gap-2">
        {whatHappens(days).map((line) => (
          <Text key={line} tone="muted">
            • {line}
          </Text>
        ))}
      </View>
      {sendOtp.isError && <Banner tone="warning" title={errorMessage(sendOtp.error)} />}
      {sent && !blocked && (
        <View className="gap-3">
          <Text>Enter the OTP sent to {formatPhone(phone)}</Text>
          <OtpInput value={otp} onChangeText={setOtp} error={remove.isError} disabled={remove.isPending} />
          {remove.isError && <Text tone="danger">{errorMessage(remove.error)}</Text>}
        </View>
      )}
    </Screen>
  );
}
