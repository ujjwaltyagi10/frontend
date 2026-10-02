import { router } from 'expo-router';
import { useState } from 'react';

import { Button, Text } from '@/components/ui';
import { useTranslation } from '@/lib/i18n';

import { LoginLayout } from '../components/login-layout';
import { OtpStep } from '../components/otp-step';
import { PhoneStep } from '../components/phone-step';

const close = () => {
  if (router.canGoBack()) router.back();
};

/**
 * A10 → A7/A8 as a modal (CD-024): a guest who tries to pay logs in here and lands back on the
 * screen they came from (cart, Pass…), with the cart and location kept. Same look as first-run A7.
 */
export function LoginModalScreen() {
  const { t } = useTranslation('onboarding');
  const [phone, setPhone] = useState<string | null>(null);

  return (
    <LoginLayout
      testID="A7-modal"
      corner={{ label: t('login.notNow'), onPress: close }}
      collage={phone === null}
      legal={phone === null}>
      {phone === null ? (
        <>
          <Text variant="h2" className="text-center">
            {t('login.title')}
          </Text>
          <Text tone="muted" className="-mt-2 text-center">
            {t('login.cartSaved')}
          </Text>
          <PhoneStep autoFocus={false} onSent={setPhone} />
        </>
      ) : (
        <>
          <OtpStep phone={phone} onVerified={close} />
          <Button
            variant="link"
            className="self-center"
            title={t('login.changeNumber')}
            onPress={() => setPhone(null)}
          />
        </>
      )}
    </LoginLayout>
  );
}
