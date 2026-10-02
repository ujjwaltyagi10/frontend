import { useQueryClient } from '@tanstack/react-query';
import { Image } from 'expo-image';
import { router, useLocalSearchParams } from 'expo-router';
import { useEffect, useRef, useState } from 'react';
import { View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { queryKeys, type Payment } from '@/api';
import { illustrations } from '@/components/illustrations';
import { Button, Card, Icon, icons, StateView, Text } from '@/components/ui';
import { track } from '@/lib/analytics';
import { formatDay, formatDuration, formatMoney, formatTime } from '@/lib/format';
import { useErrorMessage } from '@/lib/i18n';
import { useCartDraftStore } from '@/stores';
import { colors } from '@/theme';

import { usePaymentStatus } from '../hooks/use-payment';

/** Payment result (CD-048, design pending): success with booking summary, failure, or still pending. */
export function PaymentResultScreen() {
  const { paymentId } = useLocalSearchParams<{ paymentId: string }>();
  // Keep polling here too: a "pending" payment can still resolve while the user waits.
  const [pollSince] = useState(Date.now);
  const status = usePaymentStatus(paymentId, pollSince);
  const payment = status.data;

  useOnSucceeded(payment);

  if (status.isPending) return <StateView state="loading" />;
  if (status.isError || !payment)
    return <StateView state="error" error={status.error} onRetry={status.refetch} />;

  return (
    <SafeAreaView className="flex-1 bg-page" testID="PaymentResult">
      <View className="flex-1 justify-center gap-5 p-4">
        {payment.status === 'succeeded' ? (
          <Succeeded payment={payment} />
        ) : payment.status === 'failed' || payment.status === 'cancelled' ? (
          <Failed payment={payment} />
        ) : (
          <Pending onCheck={() => status.refetch()} checking={status.isFetching} />
        )}
      </View>
    </SafeAreaView>
  );
}

/** Clear the cart, refresh bookings and record analytics exactly once per successful payment. */
function useOnSucceeded(payment: Payment | undefined) {
  const qc = useQueryClient();
  const clearCart = useCartDraftStore((s) => s.clear);
  const handled = useRef<string | null>(null);
  useEffect(() => {
    if (!payment || handled.current === payment.id) return;
    if (payment.status === 'succeeded') {
      handled.current = payment.id;
      track('payment_succeeded', { method: 'gateway', amount: payment.amountPaise });
      if (payment.purpose === 'booking') {
        clearCart();
        void qc.invalidateQueries({ queryKey: queryKeys.bookings.all });
        if (payment.booking)
          track('booking_confirmed', { mode: payment.booking.mode, amount: payment.amountPaise });
      }
      if (payment.purpose === 'topup') {
        void qc.invalidateQueries({ queryKey: queryKeys.wallet });
        void qc.invalidateQueries({ queryKey: queryKeys.walletTransactions });
      }
      if (payment.purpose === 'pass') {
        track('pass_purchased', {});
        void qc.invalidateQueries({ queryKey: queryKeys.pass.all });
      }
    } else if (payment.status === 'failed') {
      handled.current = payment.id;
      track('payment_failed', {
        method: 'gateway',
        amount: payment.amountPaise,
        error_code: payment.errorCode ?? 'UNKNOWN',
      });
    }
  }, [payment, clearCart, qc]);
}

const SUCCESS_TITLE = { booking: 'Booking confirmed', topup: 'Money added', pass: 'Pass activated' } as const;

function Succeeded({ payment }: { payment: Payment }) {
  const b = payment.booking;
  return (
    <>
      <Image
        source={illustrations.paymentSuccess}
        style={{ width: 140, height: 140, alignSelf: 'center' }}
        accessible={false}
      />
      <Text variant="h1" className="text-center">
        {SUCCESS_TITLE[payment.purpose]}
      </Text>
      {b && (
        <Card>
          <Text weight="semibold">{b.serviceNames.join(', ')}</Text>
          <Text tone="muted">
            {formatDay(b.slotStart)}, {formatTime(b.slotStart)} · {formatDuration(b.durationMin)}
          </Text>
          <Text weight="semibold">Paid {formatMoney(payment.amountPaise)}</Text>
          <Text variant="caption" tone="muted">
            We&apos;ll share your professional&apos;s details before the visit.
          </Text>
        </Card>
      )}
      {payment.purpose === 'topup' && (
        <Text tone="muted" className="text-center">
          {formatMoney(payment.amountPaise)} is in your wallet. Any bonus shows as reward balance.
        </Text>
      )}
      {payment.purpose === 'pass' && (
        <Text tone="muted" className="text-center">
          It applies automatically on your next bookings.
        </Text>
      )}
      {payment.purpose === 'booking' && (
        <Button title="View my bookings" size="lg" fullWidth onPress={() => goToTab('/bookings')} />
      )}
      {payment.purpose === 'topup' && (
        <Button title="Back to ChoreDash Money" size="lg" fullWidth onPress={() => goToTab('/wallet')} />
      )}
      {payment.purpose === 'pass' && (
        <Button title="Book now" size="lg" fullWidth onPress={() => goToTab('/')} />
      )}
      <Button title="Back to home" variant="ghost" className="self-center" onPress={() => goToTab('/')} />
    </>
  );
}

/** Where "Try again" goes: a booking needs a fresh one from the cart; the others retry where they started. */
function retry(payment: Payment) {
  if (payment.purpose === 'booking') router.dismissTo('/cart');
  else if (payment.purpose === 'pass') router.dismissTo('/pass');
  else goToTab('/wallet');
}

function Failed({ payment }: { payment: Payment }) {
  const errorMessage = useErrorMessage();
  return (
    <>
      <ResultIcon tone="danger" />
      <Text variant="h1" className="text-center">
        Payment didn&apos;t go through
      </Text>
      <Text tone="muted" className="text-center">
        {errorMessage(payment.errorCode ?? 'PAYMENT_FAILED')}
      </Text>
      <Button title="Try again" size="lg" fullWidth onPress={() => retry(payment)} />
      <Button title="Back to home" variant="ghost" className="self-center" onPress={() => goToTab('/')} />
    </>
  );
}

function Pending({ onCheck, checking }: { onCheck: () => void; checking: boolean }) {
  return (
    <>
      <ResultIcon tone="warning" />
      <Text variant="h1" className="text-center">
        We&apos;re confirming your payment
      </Text>
      <Text tone="muted" className="text-center">
        Your bank hasn&apos;t replied yet. If money was taken, your booking will be confirmed automatically or
        the amount refunded — you won&apos;t be charged twice.
      </Text>
      <Button title="Check status" size="lg" fullWidth loading={checking} onPress={onCheck} />
      <Button title="Back to home" variant="ghost" className="self-center" onPress={() => goToTab('/')} />
    </>
  );
}

/** Close the checkout flow and land on a tab. */
function goToTab(href: '/' | '/bookings' | '/wallet') {
  router.dismissAll();
  router.navigate(href);
}

function ResultIcon({ tone }: { tone: 'danger' | 'warning' }) {
  const map = {
    danger: { icon: icons.close, bg: 'bg-danger', color: colors.brand.onDark },
    warning: { icon: icons.info, bg: 'bg-muted', color: colors.text.secondary },
  }[tone];
  return (
    <View className={`h-20 w-20 items-center justify-center self-center rounded-pill ${map.bg}`}>
      <Icon name={map.icon} size={36} color={map.color} />
    </View>
  );
}
