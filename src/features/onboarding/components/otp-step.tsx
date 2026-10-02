import { useEffect, useState } from 'react';
import { View } from 'react-native';

import { Button, OtpInput, Text } from '@/components/ui';
import { OTP_RESEND_SECONDS } from '@/config/constants';
import { env } from '@/config/env';
import { track } from '@/lib/analytics';
import { formatPhone } from '@/lib/format';
import { useErrorMessage, useTranslation } from '@/lib/i18n';

import { useSendOtp, useVerifyOtp } from '../hooks/use-auth';

/** A8–A11 body: OTP entry, auto-submit on the 6th digit, clear + message on a wrong code. */
export function OtpStep({ phone, onVerified }: { phone: string; onVerified?: () => void }) {
  const { t } = useTranslation('onboarding');
  const errorMessage = useErrorMessage();
  const [otp, setOtp] = useState('');
  const [attempt, setAttempt] = useState(0);
  const [secondsLeft, setSecondsLeft] = useState(OTP_RESEND_SECONDS);
  const verify = useVerifyOtp();
  const resend = useSendOtp();

  useEffect(() => {
    if (secondsLeft <= 0) return;
    const id = setTimeout(() => setSecondsLeft((s) => s - 1), 1000);
    return () => clearTimeout(id);
  }, [secondsLeft]);

  const submit = (code: string) => {
    const n = attempt + 1;
    setAttempt(n);
    verify.mutate(
      { phone, otp: code },
      {
        onSuccess: () => {
          track('otp_verified', { attempt: n });
          onVerified?.();
        },
        onError: () => {
          track('otp_failed', { attempt: n });
          setOtp(''); // wrong code → clear the boxes and show the message (fixes Pronto A11)
        },
      },
    );
  };

  return (
    <>
      <View className="items-center gap-0.5">
        <Text variant="h2" className="text-center">
          {t('otp.title')}
        </Text>
        <Text variant="h3" tone="accent" numberOfLines={1}>
          {formatPhone(phone)}
        </Text>
      </View>
      <OtpInput
        value={otp}
        onChangeText={(v) => {
          setOtp(v);
          if (verify.isError) verify.reset();
        }}
        onComplete={submit}
        error={verify.isError}
        disabled={verify.isPending}
      />
      {verify.isError && (
        <Text tone="danger" className="text-center">
          {errorMessage(verify.error)}
        </Text>
      )}
      {env.useMocks && (
        <Text variant="caption" tone="muted" className="text-center">
          {t('otp.mockHint')}
        </Text>
      )}
      {secondsLeft > 0 ? (
        <Text tone="muted" className="text-center">
          {t('otp.resendIn', { seconds: secondsLeft })}
        </Text>
      ) : (
        <Button
          variant="link"
          className="self-center"
          title={t('otp.resend')}
          loading={resend.isPending}
          onPress={() =>
            resend.mutate(
              { phone, whatsappOptIn: false },
              { onSuccess: () => setSecondsLeft(OTP_RESEND_SECONDS) },
            )
          }
        />
      )}
    </>
  );
}
