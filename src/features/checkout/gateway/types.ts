import type { Payment } from '@/api';

export type UpiApp = 'phonepe' | 'gpay' | 'paytm' | 'slice' | 'supermoney';

export type GatewayMethod = { kind: 'upi_app'; app: UpiApp } | { kind: 'upi_any' } | { kind: 'card' };

/**
 * `completed` only means the user finished in the gateway UI. Whether money moved is decided by
 * the server (webhook), so the app always polls GET /payments/{id} afterwards.
 */
export type GatewayResult = 'completed' | 'dismissed';

export interface PaymentGateway {
  open(payment: Payment, method: GatewayMethod): Promise<GatewayResult>;
}
