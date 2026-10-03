import { env } from '@/config/env';

import { mockGateway } from './mock-gateway';
import { razorpayGateway } from './razorpay-gateway';
import type { PaymentGateway } from './types';

// The test sheet in mock mode and development builds; Razorpay for staging and production.
export const useTestGateway = env.useMocks || env.appEnv === 'development';
export const gateway: PaymentGateway = useTestGateway ? mockGateway : razorpayGateway;
export { MockGatewaySheet } from './mock-gateway';
export type { GatewayMethod, GatewayResult, PayMethod, UpiApp } from './types';
