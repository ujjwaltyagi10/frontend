import { useLocalSearchParams } from 'expo-router';

import { Screen } from '@/components/ui';

import { OtpStep } from '../components/otp-step';

/** A8–A11 — OTP after A7. Verifying signs in; the root layout then shows the main app. */
export function OtpScreen() {
  const { phone = '' } = useLocalSearchParams<{ phone: string }>();
  return (
    <Screen testID="A8">
      <OtpStep phone={phone} />
    </Screen>
  );
}
