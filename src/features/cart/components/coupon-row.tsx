import { router } from 'expo-router';
import { View } from 'react-native';

import type { CartQuote } from '@/api';
import { Button, ListGroup, ListRow, Text } from '@/components/ui';
import { useCartDraftStore } from '@/stores';

/** CT-9: applied coupon (or why it failed), and the way into Offers (F5). */
export function CouponRow({ coupon }: { coupon: CartQuote['coupon'] }) {
  const setCoupon = useCartDraftStore((s) => s.setCoupon);
  if (!coupon) {
    return (
      <ListGroup>
        <ListRow
          title="View all coupons"
          icon={{ ios: 'tag', android: 'sell', web: 'sell' }}
          onPress={() => router.push('/offers')}
        />
      </ListGroup>
    );
  }
  return (
    <View className="flex-row items-center gap-3 border-b border-line py-3">
      <View className="flex-1">
        <Text weight="semibold">{coupon.code}</Text>
        <Text variant="caption" tone={coupon.valid ? 'success' : 'danger'}>
          {coupon.message ?? (coupon.valid ? 'Applied' : 'Not valid')}
        </Text>
      </View>
      <Button size="sm" variant="ghost" title="Remove" onPress={() => setCoupon(null)} />
    </View>
  );
}
