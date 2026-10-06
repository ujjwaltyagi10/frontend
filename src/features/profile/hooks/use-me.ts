import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';

import { api, queryKeys, type MePatch } from '@/api';
import { useCartDraftStore, useSessionStore } from '@/stores';

export function useMe() {
  const isUser = useSessionStore((s) => s.status === 'authenticated');
  return useQuery({ queryKey: queryKeys.me, queryFn: api.profile.me, enabled: isUser });
}

/** H3: save, then keep the cached session user (shown across the app) in step. */
export function useUpdateMe() {
  const qc = useQueryClient();
  const setUser = useSessionStore((s) => s.setUser);
  return useMutation({
    mutationFn: (patch: MePatch) => api.profile.update(patch),
    onSuccess: (me) => {
      qc.setQueryData(queryKeys.me, me);
      const { whatsappOptIn: _w, ...user } = me;
      return setUser(user);
    },
  });
}

/** H10 step 1: send an OTP to the user's own number. */
export function useSendDeletionOtp() {
  return useMutation({
    mutationFn: (phone: string) => api.auth.sendOtp({ phone, whatsappOptIn: false }),
  });
}

/** H10: can the account be deleted now, and what ChoreDash Money / Pass would be lost. */
export function useDeletionCheck() {
  return useQuery({ queryKey: ['me', 'deletion'], queryFn: api.profile.deletionCheck, staleTime: 0 });
}

/** H10 step 2: erase the account, then forget everything on the device. */
export function useDeleteAccount() {
  const signOut = useSessionStore((s) => s.signOut);
  const clearCart = useCartDraftStore((s) => s.clear);
  return useMutation({
    mutationFn: (otp: string) => api.profile.remove(otp),
    onSuccess: async () => {
      clearCart();
      await signOut();
    },
  });
}
