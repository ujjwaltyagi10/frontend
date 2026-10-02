import { View } from 'react-native';

import type { QuoteLine } from '@/api';
import { ServiceArt } from '@/components/service-art';
import { DurationStepper, IconButton, icons, PriceText, Text } from '@/components/ui';
import { useCartDraftStore } from '@/stores';

type Props = {
  serviceSlug: string;
  durationMin: number;
  /** Server-priced line; absent until the first quote for this item arrives. */
  line: QuoteLine | undefined;
};

/** One cart item: image, name, server price, 30-min stepper, remove (CT-2). */
export function CartItemRow({ serviceSlug, durationMin, line }: Props) {
  const setDuration = useCartDraftStore((s) => s.setDuration);
  const removeItem = useCartDraftStore((s) => s.removeItem);
  const name = line?.name ?? serviceSlug;

  return (
    <View className="flex-row items-center gap-3 py-3">
      <ServiceArt slug={serviceSlug} imageUrl={line?.imageUrl} size={56} rounded="chip" />
      <View className="flex-1 gap-1">
        <Text weight="semibold" numberOfLines={1}>
          {name}
        </Text>
        {line && line.durationMin === durationMin ? (
          <PriceText price={line.pricePaise} mrp={line.mrpPaise} size="sm" />
        ) : (
          <Text variant="caption" tone="muted">
            Updating price…
          </Text>
        )}
        <DurationStepper value={durationMin} onChange={(m) => setDuration(serviceSlug, m)} />
      </View>
      <IconButton
        icon={icons.close}
        size={16}
        accessibilityLabel={`Remove ${name}`}
        onPress={() => removeItem(serviceSlug)}
      />
    </View>
  );
}
