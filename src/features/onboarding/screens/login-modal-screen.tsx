import { router } from 'expo-router';
import { useState } from 'react';

import { Button, Screen, Text, toast } from '@/components/ui';
import { useTranslation } from '@/lib/i18n';

import { OtpStep } from '../components/otp-step';
import { PhoneStep } from '../components/phone-step';

/**
 * A10 → A7/A8 as a modal (CD-024): a guest who tries to pay logs in here and lands back on the
 * screen they came from (cart, Pass…), with the cart and location kept.
 */
export function LoginModalScreen() {
  const { t } = useTranslation('onboarding');
  const [phone, setPhone] = useState<string | null>(null);

  const done = () => {
    toast.success('You are logged in');
    if (router.canGoBack()) router.back();
  };

  return (
    <Screen edges={[]} testID="A7-modal">
      {phone === null ? (
        <>
          <Text variant="h1">{t('login.title')}</Text>
          <Text tone="muted">Log in to book and pay. Your cart is saved.</Text>
          <PhoneStep onSent={setPhone} />
        </>
      ) : (
        <>
          <OtpStep phone={phone} onVerified={done} />
          <Button variant="ghost" title="Change number" onPress={() => setPhone(null)} />
        </>
      )}
    </Screen>
  );
}
