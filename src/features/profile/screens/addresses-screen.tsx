import { router } from 'expo-router';
import { useState } from 'react';
import { View } from 'react-native';

import type { Address } from '@/api';
import {
  Button,
  Card,
  ConfirmSheet,
  EmptyState,
  Icon,
  IconButton,
  icons,
  Screen,
  SkeletonText,
  StateView,
  Text,
  toast,
} from '@/components/ui';
import { useAddresses, useDeleteAddress } from '@/hooks';
import { formatPhone } from '@/lib/format';
import { useErrorMessage } from '@/lib/i18n';

/** H4 My Addresses (CD-065): saved addresses, add, delete. */
export function AddressesScreen() {
  const addresses = useAddresses();
  const remove = useDeleteAddress();
  const errorMessage = useErrorMessage();
  const [confirm, setConfirm] = useState<Address | null>(null);

  const add = () => router.push('/address-form');

  return (
    <Screen edges={[]} testID="H4" onRefresh={addresses.refetch} refreshing={addresses.isRefetching}>
      <Button
        title="Add address"
        variant="secondary"
        icon={<Icon name={icons.plus} size={14} />}
        onPress={add}
      />
      {addresses.isPending ? (
        <SkeletonText lines={6} />
      ) : addresses.isError ? (
        <StateView state="error" error={addresses.error} onRetry={addresses.refetch} />
      ) : addresses.data.length === 0 ? (
        <EmptyState
          title="No saved addresses"
          message="Save an address to book faster."
          actionTitle="Add address"
          onAction={add}
        />
      ) : (
        addresses.data.map((a) => (
          <Card key={a.id}>
            <View className="flex-row items-start gap-3">
              <Icon name={{ ios: 'mappin.and.ellipse', android: 'location_on', web: 'location_on' }} />
              <View className="flex-1 gap-0.5">
                <Text weight="semibold">{a.label}</Text>
                <Text variant="caption" tone="muted">
                  {[a.flatNo, a.line1, a.landmark].filter(Boolean).join(', ')}
                </Text>
                <Text variant="caption" tone="muted">
                  {a.contactName} · {formatPhone(a.contactPhone)}
                </Text>
              </View>
              <IconButton
                icon={{ ios: 'trash', android: 'delete', web: 'delete' }}
                accessibilityLabel={`Delete ${a.label} address`}
                onPress={() => setConfirm(a)}
              />
            </View>
          </Card>
        ))
      )}
      <ConfirmSheet
        visible={!!confirm}
        onClose={() => setConfirm(null)}
        title={`Delete ${confirm?.label ?? ''} address?`}
        message="Past bookings keep their address; you just won't see it here."
        cancelTitle="Keep"
        confirmTitle="Delete"
        destructive
        loading={remove.isPending}
        onConfirm={() =>
          confirm &&
          remove.mutate(confirm.id, {
            onSuccess: () => {
              setConfirm(null);
              toast.success('Address deleted');
            },
            onError: (e) => toast.error(errorMessage(e)),
          })
        }
      />
    </Screen>
  );
}
