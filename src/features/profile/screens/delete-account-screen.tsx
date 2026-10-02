import { useState } from 'react';
import { View } from 'react-native';

import { Banner, Button, OtpInput, Screen, StickyFooter, Text } from '@/components/ui';
import { formatPhone } from '@/lib/format';
import { useErrorMessage } from '@/lib/i18n';
import { useSessionStore } from '@/stores';

import { useDeleteAccount, useSendDeletionOtp } from '../hooks/use-me';

const WHAT_HAPPENS = [
  'Your name, phone number, email and saved addresses are erased right away.',
  'You are logged out on every device.',
  'Any ChoreDash Money balance and active Pass are forfeited — they can’t be withdrawn.',
  'Past booking amounts and dates are kept without your name, as tax law requires.',
];

/** H10 Delete account (CD-067, PF-6): in-app, confirmed by OTP — replaces Pronto's email-only flow. */
export function DeleteAccountScreen() {
  const phone = useSessionStore((s) => s.user?.phone ?? '');
  const sendOtp = useSendDeletionOtp();
  const remove = useDeleteAccount();
  const errorMessage = useErrorMessage();
  const [otp, setOtp] = useState('');

  const confirm = (code: string) =>
    remove.mutate(code, {
      onError: () => setOtp(''),
    });

  const sent = sendOtp.isSuccess;
  return (
    <Screen
      edges={[]}
      testID="H10"
      footer={
        <StickyFooter>
          {sent ? (
            <Button
              title="Delete my account"
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
              loading={sendOtp.isPending}
              onPress={() => sendOtp.mutate(phone)}
            />
          )}
        </StickyFooter>
      }>
      <Text variant="h2">Delete your account?</Text>
      <View className="gap-2">
        {WHAT_HAPPENS.map((line) => (
          <Text key={line} tone="muted">
            • {line}
          </Text>
        ))}
      </View>
      {sendOtp.isError && <Banner tone="warning" title={errorMessage(sendOtp.error)} />}
      {sent && (
        <View className="gap-3">
          <Text>Enter the OTP sent to {formatPhone(phone)}</Text>
          <OtpInput value={otp} onChangeText={setOtp} error={remove.isError} disabled={remove.isPending} />
          {remove.isError && <Text tone="danger">{errorMessage(remove.error)}</Text>}
        </View>
      )}
    </Screen>
  );
}
