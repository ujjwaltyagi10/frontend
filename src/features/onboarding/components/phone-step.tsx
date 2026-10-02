import { Checkbox } from 'expo-checkbox';
import { useState } from 'react';
import { Pressable } from 'react-native';

import { Button, isValidPhone, PhoneInput, Text } from '@/components/ui';
import { useErrorMessage, useTranslation } from '@/lib/i18n';
import { colors } from '@/theme';

import { useSendOtp } from '../hooks/use-auth';

/** A7 body: phone number + WhatsApp opt-in; calls onSent once the OTP is on its way. */
export function PhoneStep({
  onSent,
  autoFocus = true,
}: {
  onSent: (phone: string) => void;
  autoFocus?: boolean;
}) {
  const { t } = useTranslation('onboarding');
  const { t: tc } = useTranslation();
  const errorMessage = useErrorMessage();
  const [phone, setPhone] = useState('');
  const [whatsappOptIn, setWhatsappOptIn] = useState(true);
  const sendOtp = useSendOtp();

  return (
    <>
      <PhoneInput
        value={phone}
        onChangeText={setPhone}
        placeholder={t('login.phonePlaceholder')}
        error={sendOtp.error ? errorMessage(sendOtp.error) : null}
        autoFocus={autoFocus}
      />
      <Pressable
        accessibilityRole="checkbox"
        accessibilityState={{ checked: whatsappOptIn }}
        onPress={() => setWhatsappOptIn((v) => !v)}
        className="min-h-11 flex-row items-center gap-3">
        <Checkbox
          value={whatsappOptIn}
          onValueChange={setWhatsappOptIn}
          color={whatsappOptIn ? colors.brand.dark : undefined}
          accessible={false}
        />
        <Text>{t('login.whatsappOptIn')}</Text>
      </Pressable>
      <Button
        fullWidth
        size="lg"
        title={tc('actions.continue')}
        disabled={!isValidPhone(phone)}
        loading={sendOtp.isPending}
        onPress={() => sendOtp.mutate({ phone, whatsappOptIn }, { onSuccess: () => onSent(phone) })}
      />
    </>
  );
}
