import type { Payment } from '@/api';
import { colors } from '@/theme';
import { useSessionStore } from '@/stores';

import type { GatewayMethod, GatewayResult, PaymentGateway } from './types';

/** The part of the Razorpay SDK's rejection we read. */
type RazorpayError = {
  code?: number;
  description?: string;
  error?: { reason?: string; metadata?: { payment_id?: string } };
};

// Razorpay's "user closed checkout" code (Checkout.PAYMENT_CANCELED on Android, 2 on iOS too).
const PAYMENT_CANCELLED = 2;

const DESCRIPTION: Record<Payment['purpose'], string> = {
  booking: 'Home service booking',
  topup: 'Add to ChoreDash Money',
  pass: 'ChoreDash Pass',
};

/**
 * Razorpay Standard Checkout (CD-046) through `react-native-razorpay`: native code, so it runs in a
 * development or store build, not Expo Go. The order comes from the server (POST /payments), so the
 * amount can't be changed here. Whatever the SDK says, the server decides: `completed` makes the
 * app poll GET /payments/{id}, which reflects the verified webhook.
 */
export const razorpayGateway: PaymentGateway = {
  open: async (payment: Payment, method: GatewayMethod): Promise<GatewayResult> => {
    // Loaded lazily so Jest and Expo Go never touch the native module.
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    const RazorpayCheckout = require('react-native-razorpay').default as {
      open(options: object): Promise<{ razorpay_payment_id: string }>;
    };
    const user = useSessionStore.getState().user;
    try {
      await RazorpayCheckout.open({
        key: payment.gateway.keyId,
        order_id: payment.gateway.orderId,
        amount: payment.amountPaise,
        currency: 'INR',
        name: 'ChoreDash',
        description: DESCRIPTION[payment.purpose],
        prefill: {
          contact: user?.phone ? `+91${user.phone}` : undefined,
          email: user?.email ?? undefined,
          name: [user?.firstName, user?.lastName].filter(Boolean).join(' ') || undefined,
          // Opens checkout on the method picked on F4; Razorpay lists the installed UPI apps.
          method: method.kind === 'card' ? 'card' : 'upi',
        },
        theme: { color: colors.brand.primary },
        retry: { enabled: true, max_count: 3 },
      });
      return 'completed';
    } catch (e) {
      const err = e as RazorpayError;
      // An attempt reached the bank (e.g. it failed, then the user closed): the server has its result.
      if (err.error?.metadata?.payment_id) return 'completed';
      if (err.code === PAYMENT_CANCELLED) return 'dismissed';
      throw new Error(err.description || 'Could not open payment. Please try again.');
    }
  },
};
