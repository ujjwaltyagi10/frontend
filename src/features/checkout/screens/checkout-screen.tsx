import { router, useLocalSearchParams, useNavigation } from 'expo-router';
import { usePreventRemove } from 'expo-router/react-navigation';
import { useEffect, useMemo, useRef, useState } from 'react';
import { View } from 'react-native';

import { api, type PaymentCreateRequest, type PaymentPurpose } from '@/api';
import {
  Button,
  ConfirmSheet,
  Icon,
  icons,
  Screen,
  SkeletonText,
  StateView,
  StickyFooter,
  Text,
  toast,
  type IconName,
} from '@/components/ui';
import { track } from '@/lib/analytics';
import { useWalletSummary } from '@/hooks';
import { formatMoney } from '@/lib/format';
import { useErrorMessage } from '@/lib/i18n';
import { colors } from '@/theme';

import { ConfirmingOverlay } from '../components/confirming-overlay';
import { MethodList } from '../components/method-list';
import { gateway, MockGatewaySheet, useTestGateway, type PayMethod } from '../gateway';
import { usePayFromWallet } from '../hooks/use-pay-from-wallet';
import { usePaymentIntent, usePaymentStatus } from '../hooks/use-payment';

type Params = { purpose?: string; bookingId?: string; amountPaise?: string; offerId?: string };

function toTarget(p: Params): PaymentCreateRequest | null {
  if (p.purpose === 'booking' && p.bookingId) return { purpose: 'booking', bookingId: p.bookingId };
  if (p.purpose === 'topup' && p.amountPaise) return { purpose: 'topup', amountPaise: Number(p.amountPaise) };
  if (p.purpose === 'pass' && p.offerId) return { purpose: 'pass', offerId: p.offerId };
  return null;
}

/**
 * F4 Payment options (CD-046) — one screen for bookings, wallet top-ups and Pass purchases.
 * Creates the payment intent on open, hands off to the gateway, then polls the server for the
 * result; the booking is confirmed by the gateway webhook, never by the app.
 */
export function CheckoutScreen() {
  const params = useLocalSearchParams<Params>();
  const target = useMemo(() => toTarget(params), [params]);
  const navigation = useNavigation();

  const intent = usePaymentIntent(target);
  const payment = intent.data;
  const [method, setMethod] = useState<PayMethod | null>(null);
  const walletPay = usePayFromWallet();
  const wallet = useWalletSummary();
  const errorMessage = useErrorMessage();
  const [paidFromWallet, setPaidFromWallet] = useState<string | null>(null);
  const [opening, setOpening] = useState(false);
  const [pollSince, setPollSince] = useState<number | null>(null);
  const [leaving, setLeaving] = useState(false);
  const [exitSheet, setExitSheet] = useState<null | (() => void)>(null);
  const status = usePaymentStatus(payment?.id, pollSince);
  const tracked = useRef(false);

  useEffect(() => {
    if (!payment || tracked.current) return;
    tracked.current = true;
    track('checkout_started', { purpose: payment.purpose, amount: payment.amountPaise });
  }, [payment]);

  // Final answer from the server (or 60 s without one) → result screen. A payment can also be
  // final at creation: a coupon covering the whole bill confirms a ₹0 booking with no gateway step.
  const settledOnCreate = payment?.status === 'succeeded';
  const done = settledOnCreate || (pollSince !== null && (status.isFinal || status.timedOut));
  const exiting = leaving || done || paidFromWallet !== null;

  // F6: leaving before paying asks first; while confirming, Back does nothing.
  usePreventRemove(!exiting && !!payment, ({ data }) => {
    if (pollSince !== null) return;
    setExitSheet(() => () => navigation.dispatch(data.action));
  });

  useEffect(() => {
    // Runs after the render where `exiting` released the Back guard, so replace() isn't blocked.
    if (done && payment) router.replace({ pathname: '/payment-result', params: { paymentId: payment.id } });
  }, [done, payment]);

  useEffect(() => {
    if (paidFromWallet)
      router.replace({ pathname: '/payment-result', params: { walletBookingId: paidFromWallet } });
  }, [paidFromWallet]);

  const exit = async () => {
    const proceed = exitSheet;
    setExitSheet(null);
    if (payment) await api.checkout.cancelPayment(payment.id).catch(() => undefined);
    setLeaving(true);
    proceed?.();
  };

  const pay = async () => {
    if (!payment || !method) return;
    if (method.kind === 'wallet') {
      if (!payment.bookingId) return;
      walletPay.mutate(payment.bookingId, {
        onSuccess: ({ booking }) => setPaidFromWallet(booking.id),
        onError: (e) => {
          toast.error(errorMessage(e));
          void wallet.refetch(); // the balance may have changed elsewhere
        },
      });
      return;
    }
    setOpening(true);
    try {
      const result = await gateway.open(payment, method);
      if (result === 'completed') setPollSince(Date.now());
    } catch (e) {
      toast.error(e instanceof Error ? e.message : 'Could not open payment');
    } finally {
      setOpening(false);
    }
  };

  if (!target) return <StateView state="error" error={new Error('Nothing to pay for')} />;
  if (intent.isError) return <StateView state="error" error={intent.error} onRetry={intent.refetch} />;

  return (
    <View className="flex-1">
      <Screen
        edges={[]}
        testID="F4"
        footer={
          <StickyFooter>
            <Button
              title={
                !payment
                  ? 'Pay'
                  : method
                    ? `Pay ${formatMoney(payment.amountPaise)}`
                    : 'Choose a payment method'
              }
              size="lg"
              fullWidth
              disabled={!payment || !method}
              loading={opening || walletPay.isPending}
              onPress={pay}
            />
          </StickyFooter>
        }>
        {!payment ? (
          <SkeletonText lines={6} />
        ) : (
          <>
            <PaySummary purpose={payment.purpose} amountPaise={payment.amountPaise} />
            <MethodList
              value={method}
              onChange={setMethod}
              wallet={
                payment.purpose === 'booking'
                  ? { balancePaise: wallet.data?.totalPaise, amountPaise: payment.amountPaise }
                  : null
              }
            />
            <View className="flex-row items-center justify-center gap-2 px-4">
              <Icon
                name={{ ios: 'lock.fill', android: 'lock', web: 'lock' }}
                size={12}
                color={colors.text.secondary}
              />
              <Text variant="caption" tone="muted" className="text-center">
                Secured by Razorpay. ChoreDash never sees your card or UPI PIN.
              </Text>
            </View>
          </>
        )}
      </Screen>
      {pollSince !== null && !done && <ConfirmingOverlay />}
      {useTestGateway && <MockGatewaySheet />}
      <ConfirmSheet
        visible={!!exitSheet}
        onClose={() => setExitSheet(null)}
        title="Are you sure you want to exit?"
        message="Your payment isn't complete. You can come back from the cart."
        cancelTitle="Stay"
        confirmTitle="Yes, exit"
        onConfirm={exit}
      />
    </View>
  );
}

const PURPOSE: Record<PaymentPurpose, { title: string; note?: string; icon: IconName }> = {
  booking: {
    title: 'Your booking',
    note: 'Your slot is held for 10 minutes while you pay.',
    icon: { ios: 'calendar', android: 'calendar_month', web: 'calendar_month' },
  },
  topup: {
    title: 'Add to ChoreDash Money',
    note: 'Bonus rewards are added once the payment succeeds.',
    icon: icons.wallet,
  },
  pass: { title: 'ChoreDash Pass', note: '3 visits of 60 minutes, valid 30 days.', icon: icons.gift },
};

/** F4 header: what this payment is for, and the server's amount. */
function PaySummary({ purpose, amountPaise }: { purpose: PaymentPurpose; amountPaise: number }) {
  const p = PURPOSE[purpose];
  return (
    <View className="gap-3 rounded-hero border border-line bg-card p-5">
      <View className="flex-row items-center gap-3">
        <View className="h-10 w-10 items-center justify-center rounded-pill bg-muted">
          <Icon name={p.icon} size={18} color={colors.text.secondary} />
        </View>
        <Text weight="semibold" className="flex-1">
          {p.title}
        </Text>
      </View>
      <View className="gap-0.5">
        <Text variant="caption" tone="muted">
          To pay
        </Text>
        <Text variant="display" tone="brand">
          {formatMoney(amountPaise)}
        </Text>
      </View>
      {p.note && (
        <Text variant="caption" tone="muted">
          {p.note}
        </Text>
      )}
    </View>
  );
}
