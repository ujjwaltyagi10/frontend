import { Image } from 'expo-image';
import { router } from 'expo-router';
import { useState } from 'react';

import { illustrations } from '@/components/illustrations';
import { EmptyState, Screen, SegmentedTabs, SkeletonText, StateView, Text } from '@/components/ui';
import { useRecurringPlans } from '@/hooks';
import { useTranslation } from '@/lib/i18n';
import { useSessionStore } from '@/stores';

import { BookingCard } from '../components/booking-card';
import { PlanCard } from '../components/plan-card';
import { useBookings } from '../hooks/use-bookings';

const TABS = [
  { value: 'upcoming', label: 'Upcoming' },
  { value: 'past', label: 'Previous' },
] as const;

/** G1–G2 My Bookings. (Booking card details + Help entry: CD-059.) */
export function BookingsScreen({ showTitle = true }: { showTitle?: boolean }) {
  const [tab, setTab] = useState<'upcoming' | 'past'>('upcoming');
  const isGuest = useSessionStore((s) => s.status === 'guest');
  const bookings = useBookings(tab);
  const { t } = useTranslation('recurring');
  // Active plans on Upcoming, stopped ones on Previous.
  const plans = (useRecurringPlans().data ?? []).filter((p) =>
    tab === 'upcoming' ? p.status === 'active' : p.status === 'stopped',
  );

  return (
    <Screen testID="G1" edges={showTitle ? ['top'] : []}>
      {showTitle && <Text variant="h1">My Bookings</Text>}
      <SegmentedTabs options={TABS} value={tab} onChange={setTab} />
      {!isGuest && plans.length > 0 && (
        <>
          <Text variant="h3">{t('plansTitle')}</Text>
          {plans.map((p) => (
            <PlanCard key={p.id} plan={p} />
          ))}
        </>
      )}
      {isGuest ? (
        <EmptyState
          illustration={<EmptyArt />}
          title="Log in to see your bookings"
          actionTitle="Log in"
          onAction={() => router.push('/login-modal')}
        />
      ) : bookings.isPending ? (
        <SkeletonText lines={4} />
      ) : bookings.isError ? (
        <StateView state="error" error={bookings.error} onRetry={bookings.refetch} />
      ) : bookings.data.items.length === 0 && plans.length > 0 ? (
        // A plan but nothing booked yet: its visits are booked 48 h ahead — not "no bookings".
        tab === 'upcoming' ? (
          <Text variant="caption" tone="muted">
            {t('visitsSoon')}
          </Text>
        ) : null
      ) : bookings.data.items.length === 0 ? (
        <EmptyState
          illustration={<EmptyArt />}
          title="No bookings found"
          actionTitle="Book a service"
          onAction={() => router.navigate('/')}
        />
      ) : (
        <>
          {plans.length > 0 && <Text variant="h3">{t('bookingsTitle')}</Text>}
          {bookings.data.items.map((b) => (
            <BookingCard key={b.id} booking={b} />
          ))}
        </>
      )}
    </Screen>
  );
}

/** G2: the same list opened from Profile, where the stack header already says "My Bookings". */
export function ProfileBookingsScreen() {
  return <BookingsScreen showTitle={false} />;
}

function EmptyArt() {
  return (
    <Image source={illustrations.emptyBookings} style={{ width: 140, height: 140 }} accessible={false} />
  );
}
