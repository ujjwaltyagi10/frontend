import { router } from 'expo-router';
import { useState } from 'react';

import { Button, Text } from '@/components/ui';
import { useTranslation } from '@/lib/i18n';
import { useSessionStore } from '@/stores';

import { LoginLayout } from '../components/login-layout';
import { OtpStep } from '../components/otp-step';
import { PhoneStep } from '../components/phone-step';
import { ReferralCodeStep } from '../components/referral-code-step';

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
  const offerReferral = useSessionStore((s) => s.offerReferral);
  const setOfferReferral = useSessionStore((s) => s.setOfferReferral);
  const status = useSessionStore((s) => s.status);
  // A brand-new account: offer the friend's code once, then close as usual.
  const finishReferral = () => {
    setOfferReferral(false);
    close();
  };

  if (status === 'authenticated' && offerReferral)
    return (
      <LoginLayout
        testID="A9-modal"
        collage={false}
        legal={false}
        corner={{ label: 'Skip', onPress: finishReferral }}>
        <ReferralCodeStep onDone={finishReferral} />
      </LoginLayout>
    );

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
          <OtpStep
            phone={phone}
            onVerified={() => {
              if (!useSessionStore.getState().offerReferral) close();
            }}
          />
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
