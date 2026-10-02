import { request } from '../client';
import type { Me, MePatch } from '../types';

export const profileApi = {
  me: () => request<Me>({ method: 'GET', path: '/me' }),
  update: (body: MePatch) => request<Me>({ method: 'PATCH', path: '/me', body }),
  /** H10: erase the account. Needs an OTP sent to the user's own number first. */
  remove: (otp: string) => request<void>({ method: 'DELETE', path: '/me', body: { otp } }),
};
