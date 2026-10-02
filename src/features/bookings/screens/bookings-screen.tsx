import { Image } from 'expo-image';
import { router } from 'expo-router';
import { useState } from 'react';

import { illustrations } from '@/components/illustrations';
import { Card, EmptyState, Screen, SegmentedTabs, SkeletonText, StateView, Text } from '@/components/ui';
import { formatDay, formatMoney, formatTime } from '@/lib/format';
import { useSessionStore } from '@/stores';

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

  return (
    <Screen testID="G1">
      {showTitle && <Text variant="h1">My Bookings</Text>}
      <SegmentedTabs options={TABS} value={tab} onChange={setTab} />
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
      ) : bookings.data.items.length === 0 ? (
        <EmptyState
          illustration={<EmptyArt />}
          title="No bookings found"
          actionTitle="Book a service"
          onAction={() => router.navigate('/')}
        />
      ) : (
        bookings.data.items.map((b) => (
          <Card key={b.id} onPress={() => router.push({ pathname: '/bookings/[id]', params: { id: b.id } })}>
            <Text weight="semibold">{b.serviceNames.join(', ')}</Text>
            <Text variant="caption" tone="muted">
              {formatDay(b.slotStart)} · {formatTime(b.slotStart)} · {formatMoney(b.totalPaise)}
            </Text>
          </Card>
        ))
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
