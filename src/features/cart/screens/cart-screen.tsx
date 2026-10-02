import { router } from 'expo-router';
import { Pressable, View } from 'react-native';
import { useShallow } from 'zustand/react/shallow';

import { useFeatureFlag, type BookingMode } from '@/api';
import {
  Button,
  Card,
  EmptyState,
  Icon,
  icons,
  PriceText,
  Screen,
  SegmentedTabs,
  SkeletonText,
  StateView,
  StickyFooter,
  Text,
} from '@/components/ui';
import { ARRIVAL_WINDOW_MIN } from '@/config/constants';
import { track } from '@/lib/analytics';
import { formatDay, formatMoney, formatTime } from '@/lib/format';
import { useCartDraftStore, useLocationStore, useSessionStore } from '@/stores';

import { BillCard } from '../components/bill-card';
import { BookingDetails } from '../components/booking-details';
import { CartItemRow } from '../components/cart-item-row';
import { CouponRow } from '../components/coupon-row';
import { InstantUnavailableBanner } from '../components/instant-unavailable-banner';
import { useCartQuote } from '../hooks/use-cart-quote';
import { useCreateBooking } from '../hooks/use-create-booking';
import { getNextStep, type NextStep } from '../logic/next-step';

const ALL_MODES = [
  { value: 'instant', label: 'Instant' },
  { value: 'scheduled', label: 'Scheduled' },
  { value: 'recurring', label: 'Recurring' },
] as const;

/** D2–D5 Cart (CD-037): mode tabs, items, slot, coupons, booking details, bill, next-step footer. */
export function CartScreen() {
  const { mode, items, slotStart, recurrence, setMode } = useCartDraftStore(
    useShallow((s) => ({
      mode: s.mode,
      items: s.items,
      slotStart: s.slotStart,
      recurrence: s.recurrence,
      setMode: s.setMode,
    })),
  );
  const addressId = useLocationStore((s) => s.location?.addressId ?? null);
  const isGuest = useSessionStore((s) => s.status === 'guest');
  const recurringEnabled = useFeatureFlag('recurring');
  const { quote, error, refetch, isStale } = useCartQuote();
  const createBooking = useCreateBooking();

  const modes = recurringEnabled ? ALL_MODES : ALL_MODES.filter((m) => m.value !== 'recurring');
  const step = getNextStep({
    itemCount: items.length,
    mode,
    quote,
    quoteIsStale: isStale,
    slotStart,
    hasRecurrence: !!recurrence,
    isGuest,
    addressId,
  });

  const changeMode = (m: BookingMode) => {
    setMode(m);
    track('cart_mode_changed', { mode: m });
  };
  const openSchedule = () => router.push({ pathname: '/schedule', params: { from: 'cart' } });

  const actions: Record<Exclude<NextStep, 'EMPTY'>, { title: string; onPress?: () => void }> = {
    QUOTING: { title: 'Updating price…' },
    NOT_SERVICEABLE: { title: 'Not in your area yet' },
    SCHEDULE_INSTEAD: {
      title: 'Schedule for later',
      onPress: () => {
        changeMode('scheduled');
        openSchedule();
      },
    },
    PICK_SLOT: { title: 'Pick a slot', onPress: openSchedule },
    SET_UP_RECURRING: { title: 'Set up recurring visits', onPress: () => router.push('/recurring') },
    LOGIN: { title: 'Log in to continue', onPress: () => router.push('/login-modal') },
    ADD_ADDRESS: { title: 'Add flat / house no.', onPress: () => router.push('/address-form') },
    PAY: {
      title: quote ? `Pay ${formatMoney(quote.totalPaise)}` : 'Pay',
      onPress: () => quote && createBooking.mutate(quote.quoteId),
    },
  };

  if (step === 'EMPTY') {
    return (
      <Screen edges={[]} testID="D2">
        <EmptyState
          title="Your cart is empty"
          message="Add a service to book a trained professional."
          actionTitle="Browse services"
          onAction={() => router.navigate('/')}
        />
      </Screen>
    );
  }

  const action = actions[step];
  const footer = (
    <StickyFooter
      summary={
        quote && (
          <View className={isStale ? 'opacity-40' : ''}>
            <PriceText price={quote.totalPaise} mrp={quote.mrpTotalPaise} />
            <Text variant="micro" tone="muted">
              incl. GST & fees
            </Text>
          </View>
        )
      }>
      <Button
        title={action.title}
        size="lg"
        fullWidth
        loading={(step === 'QUOTING' && !quote) || createBooking.isPending}
        disabled={!action.onPress}
        onPress={action.onPress}
      />
    </StickyFooter>
  );

  return (
    <Screen edges={[]} footer={footer} testID="D2">
      <SegmentedTabs options={modes} value={mode} onChange={changeMode} />

      {mode === 'instant' && quote && !quote.instant.available && (
        <InstantUnavailableBanner instant={quote.instant} onSchedule={actions.SCHEDULE_INSTEAD.onPress!} />
      )}

      {mode === 'scheduled' && (
        <Card onPress={openSchedule} accessibilityLabel={slotStart ? 'Change slot' : 'Pick a slot'}>
          <View className="flex-row items-center justify-between">
            <View className="gap-0.5">
              <Text variant="caption" tone="muted">
                Slot
              </Text>
              <Text weight="semibold">
                {slotStart ? `${formatDay(slotStart)}, ${formatTime(slotStart)}` : 'Pick a day and time'}
              </Text>
            </View>
            <Icon name={icons.chevronRight} size={14} />
          </View>
          <Text variant="caption" tone="muted">
            Your professional arrives within {ARRIVAL_WINDOW_MIN} minutes of the slot.
          </Text>
        </Card>
      )}

      {mode === 'recurring' && (
        <Card onPress={() => router.push('/recurring')} accessibilityLabel="Set up recurring visits">
          <Text weight="semibold">{recurrence ? 'Weekly plan set' : 'Choose days and a time'}</Text>
          <Text variant="caption" tone="muted">
            Each visit is booked automatically and paid from ChoreDash Money.
          </Text>
        </Card>
      )}

      <View className="rounded-card border border-line bg-card px-4 py-1">
        <Text variant="h3" className="pt-2">
          Your services
        </Text>
        {items.map((i, idx) => (
          <View key={i.serviceSlug} className={idx > 0 ? 'border-t border-line' : ''}>
            <CartItemRow
              serviceSlug={i.serviceSlug}
              durationMin={i.durationMin}
              line={quote?.lines.find((l) => l.serviceSlug === i.serviceSlug)}
            />
          </View>
        ))}
        <Pressable
          accessibilityRole="button"
          onPress={() => router.navigate('/')}
          className="min-h-12 flex-row items-center gap-2 border-t border-line active:opacity-60">
          <Icon name={icons.plus} size={14} />
          <Text weight="semibold">Add more services</Text>
        </Pressable>
      </View>

      {error && !quote ? (
        <StateView state="error" error={error} onRetry={refetch} />
      ) : !quote ? (
        <SkeletonText lines={5} />
      ) : (
        <>
          <CouponRow coupon={quote.coupon} />
          <BookingDetails />
          <BillCard quote={quote} isStale={isStale} />
        </>
      )}
    </Screen>
  );
}
