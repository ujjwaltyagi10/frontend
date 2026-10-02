import { router } from 'expo-router';
import { View } from 'react-native';

import { Button, Card, Text } from '@/components/ui';
import { formatPhone } from '@/lib/format';
import { useLocationStore, useSessionStore } from '@/stores';

import { useAddresses } from '@/hooks';

/** D3 service address and contact, each editable (CT-7). */
export function BookingDetails() {
  const location = useLocationStore((s) => s.location);
  const user = useSessionStore((s) => s.user);
  const addresses = useAddresses();
  const saved = addresses.data?.find((a) => a.id === location?.addressId);

  return (
    <Card>
      <Text variant="h3">Booking details</Text>
      <View className="flex-row items-start gap-3">
        <View className="flex-1 gap-0.5">
          <Text variant="caption" tone="muted">
            Service address
          </Text>
          <Text weight="semibold">{saved?.label ?? location?.label ?? 'No address yet'}</Text>
          <Text variant="caption" tone="muted" numberOfLines={2}>
            {saved ? [saved.flatNo, saved.line1].filter(Boolean).join(', ') : location?.line}
          </Text>
        </View>
        <Button size="sm" variant="ghost" title="Change" onPress={() => router.push('/change-location')} />
      </View>
      {(saved || user) && (
        <View className="gap-0.5 border-t border-line pt-3">
          <Text variant="caption" tone="muted">
            Contact
          </Text>
          <Text>
            {saved?.contactName ?? user?.firstName ?? ''} ·{' '}
            {formatPhone(saved?.contactPhone ?? user?.phone ?? '')}
          </Text>
        </View>
      )}
    </Card>
  );
}
