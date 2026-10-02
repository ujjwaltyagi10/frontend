import { request } from '../client';
import type { CartInput, CartQuote, SlotDay } from '../types';

export const cartApi = {
  /** Replace the cart and get a server quote. The app never computes prices itself. */
  put: (body: CartInput) => request<CartQuote>({ method: 'PUT', path: '/cart', body }),
  slots: (hubId: string, date: string, durationMin: number) =>
    request<SlotDay>({
      method: 'GET',
      path: '/slots',
      query: { hub_id: hubId, date, duration: durationMin },
    }),
};
