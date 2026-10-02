import { request } from '../client';
import type { Booking, BookingCreateRequest, Offer, Payment, PaymentCreateRequest } from '../types';

// Money-moving writes require an Idempotency-Key: create it once per user action, reuse on retry.

export const checkoutApi = {
  createBooking: (body: BookingCreateRequest, idempotencyKey: string) =>
    request<Booking>({ method: 'POST', path: '/bookings', body, idempotencyKey }),
  createPayment: (body: PaymentCreateRequest, idempotencyKey: string) =>
    request<Payment>({ method: 'POST', path: '/payments', body, idempotencyKey }),
  getPayment: (id: string) => request<Payment>({ method: 'GET', path: `/payments/${id}` }),
  /** F6 "Yes, exit": cancel the pending payment intent so it can't complete later. */
  cancelPayment: (id: string) => request<Payment>({ method: 'POST', path: `/payments/${id}/cancel` }),
  offers: () => request<Offer[]>({ method: 'GET', path: '/offers' }),
};
