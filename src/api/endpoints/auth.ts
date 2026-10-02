import { request } from '../client';
import type { OtpSendRequest, OtpSendResponse, OtpVerifyRequest, OtpVerifyResponse } from '../types';

export const authApi = {
  sendOtp: (body: OtpSendRequest) =>
    request<OtpSendResponse>({ method: 'POST', path: '/auth/otp/send', body, auth: false }),
  verifyOtp: (body: OtpVerifyRequest) =>
    request<OtpVerifyResponse>({ method: 'POST', path: '/auth/otp/verify', body, auth: false }),
  guest: () =>
    request<{ accessToken: string; refreshToken: string }>({
      method: 'POST',
      path: '/auth/guest',
      auth: false,
    }),
  logout: () => request<void>({ method: 'POST', path: '/auth/logout' }),
};
