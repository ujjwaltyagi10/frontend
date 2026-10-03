import { useSessionStore } from '@/stores';

import { LoginLayout } from '../components/login-layout';
import { ReferralCodeStep } from '../components/referral-code-step';

/** First-run, new accounts only: offered once after OTP, then on to fetching the location. */
export function ReferralCodeScreen() {
  const setOfferReferral = useSessionStore((s) => s.setOfferReferral);
  const done = () => setOfferReferral(false);
  return (
    <LoginLayout testID="A9" collage={false} legal={false} corner={{ label: 'Skip', onPress: done }}>
      <ReferralCodeStep onDone={done} />
    </LoginLayout>
  );
}
