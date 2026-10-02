import { useMutation } from '@tanstack/react-query';

import { api } from '@/api';
import { useSessionStore } from '@/stores';

/** H11 — revoke the session server-side, then clear everything local (even if the call fails). */
export function useLogout() {
  const signOut = useSessionStore((s) => s.signOut);
  return useMutation({
    mutationFn: () => api.auth.logout().catch(() => undefined),
    onSettled: () => signOut(),
  });
}
