import { request } from '../client';
import type {
  CursorPage,
  GiftCardRedeemResponse,
  Pass,
  PassOffer,
  WalletSummary,
  WalletTransaction,
} from '../types';

export const walletApi = {
  get: () => request<WalletSummary>({ method: 'GET', path: '/wallet' }),
  transactions: (cursor?: string) =>
    request<CursorPage<WalletTransaction>>({
      method: 'GET',
      path: '/wallet/transactions',
      query: { cursor },
    }),
  redeemGiftCard: (code: string, idempotencyKey: string) =>
    request<GiftCardRedeemResponse>({
      method: 'POST',
      path: '/wallet/giftcard',
      body: { code },
      idempotencyKey,
    }),
};

export const passApi = {
  offer: () => request<PassOffer>({ method: 'GET', path: '/pass/offer' }),
  /** The user's current Pass, or null if they have none active. */
  mine: () => request<Pass | null>({ method: 'GET', path: '/pass/me' }),
};
