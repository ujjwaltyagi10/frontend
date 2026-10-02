import { View } from 'react-native';
import { create } from 'zustand';

import { request, type Payment } from '@/api';
import { BottomSheet, Button, Text } from '@/components/ui';
import { formatMoney } from '@/lib/format';

import type { GatewayMethod, GatewayResult, PaymentGateway } from './types';

type Pending = { payment: Payment; method: GatewayMethod; resolve: (r: GatewayResult) => void };

const useMockGateway = create<{ pending: Pending | null }>(() => ({ pending: null }));

/**
 * Stands in for Razorpay in development: a sheet where the tester picks what the bank does. Works with
 * the in-app mocks and with the Go backend's fake gateway (both serve POST /dev/payments/{id}/outcome).
 */
export const mockGateway: PaymentGateway = {
  open: (payment, method) =>
    new Promise((resolve) => useMockGateway.setState({ pending: { payment, method, resolve } })),
};

type Outcome = 'success' | 'failure' | 'never';

/** Render once on the checkout screen; invisible until the mock gateway is opened. */
export function MockGatewaySheet() {
  const pending = useMockGateway((s) => s.pending);

  const finish = async (outcome: Outcome | 'dismiss') => {
    if (!pending) return;
    useMockGateway.setState({ pending: null });
    if (outcome === 'dismiss') return pending.resolve('dismissed');
    // Plays the gateway → backend webhook.
    await request({
      method: 'POST',
      path: `/dev/payments/${pending.payment.id}/outcome`,
      body: { outcome },
    });
    pending.resolve('completed');
  };

  return (
    <BottomSheet visible={!!pending} onClose={() => finish('dismiss')} title="Test payment (mock gateway)">
      {pending && (
        <View className="gap-3">
          <Text tone="muted">
            {formatMoney(pending.payment.amountPaise)} via {describe(pending.method)}. Choose what the bank
            does:
          </Text>
          <Button title="Payment succeeds" fullWidth onPress={() => finish('success')} />
          <Button title="Payment fails" variant="destructive" fullWidth onPress={() => finish('failure')} />
          <Button
            title="No answer (stays pending)"
            variant="secondary"
            fullWidth
            onPress={() => finish('never')}
          />
          <Button title="Close without paying" variant="ghost" fullWidth onPress={() => finish('dismiss')} />
        </View>
      )}
    </BottomSheet>
  );
}

function describe(m: GatewayMethod) {
  return m.kind === 'upi_app' ? m.app : m.kind === 'upi_any' ? 'UPI' : 'card';
}
