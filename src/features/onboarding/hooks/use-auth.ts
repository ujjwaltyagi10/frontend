import { useMutation } from '@tanstack/react-query';

import { api } from '@/api';
import { track } from '@/lib/analytics';
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
    onSuccess: ({ accessToken, refreshToken, user }) => signIn({ accessToken, refreshToken }, user),
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
