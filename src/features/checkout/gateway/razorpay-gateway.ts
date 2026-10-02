import type { PaymentGateway } from './types';

/**
 * TODO(CD-046): integrate the Razorpay React Native SDK (UPI intent to the chosen app, cards).
 * Needs `react-native-razorpay` (native code → development build, not Expo Go) and, on iOS,
 * LSApplicationQueriesSchemes so we can list only installed UPI apps.
 */
export const razorpayGateway: PaymentGateway = {
  open: async () => {
    throw new Error('Razorpay is not integrated yet (CD-046). Run with EXPO_PUBLIC_USE_MOCKS=true.');
  },
};
