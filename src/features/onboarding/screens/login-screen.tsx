import { router } from 'expo-router';

import { Button, Screen, Text } from '@/components/ui';
import { useTranslation } from '@/lib/i18n';

import { PhoneStep } from '../components/phone-step';
import { useContinueAsGuest } from '../hooks/use-auth';

/** A7 — phone number, WhatsApp opt-in, Skip login. (Image collage + legal links: CD-021.) */
export function LoginScreen() {
  const { t } = useTranslation('onboarding');
  const guest = useContinueAsGuest();
  return (
    <Screen testID="A7">
      <Text variant="h1">{t('login.title')}</Text>
      <PhoneStep onSent={(phone) => router.push({ pathname: '/otp', params: { phone } })} />
      <Button
        variant="ghost"
        className="self-center"
        title={t('login.skip')}
        loading={guest.isPending}
        onPress={() => guest.mutate()}
      />
    </Screen>
  );
}
