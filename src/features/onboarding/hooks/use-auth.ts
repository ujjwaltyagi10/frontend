import { useMutation } from '@tanstack/react-query';

import { api } from '@/api';
import { track } from '@/lib/analytics';
import { toast } from '@/components/ui';
import { useSessionStore } from '@/stores';

export function useSendOtp() {
  return useMutation({
    mutationFn: api.auth.sendOtp,
    onSuccess: () => track('otp_requested', {}),
  });
}

export function useVerifyOtp() {
  const signIn = useSessionStore((s) => s.signIn);
  return useMutation({
    mutationFn: api.auth.verifyOtp,
    onSuccess: async ({ accessToken, refreshToken, user, isNewUser, deletionCancelled }) => {
      await signIn({ accessToken, refreshToken }, user, { isNewUser });
      if (deletionCancelled) toast.info('Welcome back! Your account deletion has been cancelled.');
    },
  });
}

export function useContinueAsGuest() {
  const continueAsGuest = useSessionStore((s) => s.continueAsGuest);
  return useMutation({
    mutationFn: api.auth.guest,
    onSuccess: (tokens) => {
      track('login_skipped', {});
      return continueAsGuest(tokens);
    },
  });
}
