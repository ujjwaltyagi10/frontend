import { router, useLocalSearchParams } from 'expo-router';

import { useTranslation } from '@/lib/i18n';

import { LoginLayout } from '../components/login-layout';
import { OtpStep } from '../components/otp-step';

/** A8–A11 — OTP after A7, same brand header as login. Verifying signs in; the root then moves on. */
export function OtpScreen() {
  const { t } = useTranslation('onboarding');
  const { phone = '' } = useLocalSearchParams<{ phone: string }>();
  return (
    <LoginLayout
      testID="A8"
      collage={false}
      legal={false}
      corner={{ label: t('login.changeNumber'), onPress: () => router.back() }}>
      <OtpStep phone={phone} />
    </LoginLayout>
  );
}
