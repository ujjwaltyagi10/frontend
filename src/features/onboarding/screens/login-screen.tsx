import { router } from 'expo-router';

import { Text } from '@/components/ui';
import { useTranslation } from '@/lib/i18n';

import { LoginLayout } from '../components/login-layout';
import { PhoneStep } from '../components/phone-step';
import { useContinueAsGuest } from '../hooks/use-auth';

/** A7 — first-run login: phone number + WhatsApp opt-in, or Skip login to browse as a guest (CD-021). */
export function LoginScreen() {
  const { t } = useTranslation('onboarding');
  const guest = useContinueAsGuest();
  return (
    <LoginLayout
      testID="A7"
      corner={{ label: t('login.skip'), onPress: () => guest.mutate(), disabled: guest.isPending }}>
      <Text variant="h2" className="text-center">
        {t('login.title')}
      </Text>
      <PhoneStep autoFocus={false} onSent={(phone) => router.push({ pathname: '/otp', params: { phone } })} />
    </LoginLayout>
  );
}
