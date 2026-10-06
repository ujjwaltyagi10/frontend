import { request } from '../client';
import type { DeletionCheck, Me, MePatch } from '../types';

export const profileApi = {
  me: () => request<Me>({ method: 'GET', path: '/me' }),
  update: (body: MePatch) => request<Me>({ method: 'PATCH', path: '/me', body }),
  /** H10: whether the account can be deleted, and the ChoreDash Money / Pass that would be lost. */
  deletionCheck: () => request<DeletionCheck>({ method: 'GET', path: '/me/deletion' }),
  /**
   * H10: schedule deletion (needs an OTP sent to the user's own number). The account is logged out
   * everywhere and erased after the grace period unless the user logs in again.
   */
  remove: (otp: string) =>
    request<{ deletionDueAt: string }>({ method: 'DELETE', path: '/me', body: { otp } }),
  /** This device's Expo push token; the server forgets it when this session logs out. */
  registerDevice: (token: string, platform: 'android' | 'ios') =>
    request<void>({ method: 'POST', path: '/devices', body: { token, platform } }),
};
