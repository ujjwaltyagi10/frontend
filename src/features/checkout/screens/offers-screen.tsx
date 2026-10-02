import { useQuery } from '@tanstack/react-query';
import { router } from 'expo-router';
import { useState } from 'react';
import { View } from 'react-native';

import { api, queryKeys, type Offer } from '@/api';
import { Badge, Button, Card, Input, Screen, SkeletonText, StateView, Text } from '@/components/ui';
import { track } from '@/lib/analytics';
import { useCartDraftStore } from '@/stores';

/** F5 Offers (CD-047): enter a code or apply a listed coupon; it goes onto the cart and re-quotes. */
export function OffersScreen() {
  const offers = useQuery({ queryKey: queryKeys.offers, queryFn: api.checkout.offers });
  const current = useCartDraftStore((s) => s.couponCode);
  const setCoupon = useCartDraftStore((s) => s.setCoupon);
  const [code, setCode] = useState('');

  // Validity comes back on the next cart quote (coupon.valid / message), shown in the cart.
  const apply = (raw: string) => {
    const c = raw.trim().toUpperCase().replace(/\s+/g, '');
    if (!c) return;
    setCoupon(c);
    track('coupon_applied', { code_type: 'manual' });
    router.back();
  };

  return (
    <Screen edges={[]} testID="F5">
      <View className="flex-row items-end gap-2">
        <Input
          className="flex-1"
          label="Coupon code"
          placeholder="Enter coupon code"
          value={code}
          onChangeText={setCode}
          autoCapitalize="characters"
          autoCorrect={false}
          returnKeyType="done"
          onSubmitEditing={() => apply(code)}
        />
        {/* self-end: sit beside the field, not beside its label */}
        <Button title="Apply" className="self-end" disabled={!code.trim()} onPress={() => apply(code)} />
      </View>
      {offers.isPending ? (
        <SkeletonText lines={6} />
      ) : offers.isError ? (
        <StateView state="error" error={offers.error} onRetry={offers.refetch} />
      ) : (
        offers.data.map((o) => (
          <OfferCard key={o.id} offer={o} applied={!!o.code && o.code === current} onApply={apply} />
        ))
      )}
    </Screen>
  );
}

function OfferCard({
  offer,
  applied,
  onApply,
}: {
  offer: Offer;
  applied: boolean;
  onApply: (code: string) => void;
}) {
  return (
    <Card>
      <View className="flex-row items-start justify-between gap-3">
        <View className="flex-1 gap-1">
          {offer.code && <Badge label={offer.code} tone="dark" />}
          <Text weight="semibold">{offer.title}</Text>
          <Text variant="caption" tone="muted">
            {offer.description}
          </Text>
        </View>
        {offer.code ? (
          applied ? (
            <Badge label="Applied" tone="success" />
          ) : (
            <Button size="sm" variant="secondary" title="Apply" onPress={() => onApply(offer.code!)} />
          )
        ) : (
          <Badge label="At payment" tone="neutral" />
        )}
      </View>
    </Card>
  );
}
