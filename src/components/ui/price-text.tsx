import { View } from 'react-native';

import type { Paise } from '@/api/types';
import { formatMoney } from '@/lib/format';

import { Text, type TextVariant } from './text';

type Props = {
  price: Paise;
  mrp?: Paise | null;
  /** Show "Save ₹X" after the prices. */
  showSaving?: boolean;
  size?: 'sm' | 'md' | 'lg';
};

const sizes: Record<NonNullable<Props['size']>, { price: TextVariant; mrp: TextVariant }> = {
  sm: { price: 'caption', mrp: 'micro' },
  md: { price: 'body', mrp: 'caption' },
  lg: { price: 'h2', mrp: 'body' },
};

/** Price with a strike-through MRP (C7, D2). Displays server values only — never computes a price. */
export function PriceText({ price, mrp = null, showSaving = false, size = 'md' }: Props) {
  const s = sizes[size];
  const hasMrp = mrp !== null && mrp > price;
  return (
    <View className="flex-row flex-wrap items-baseline gap-x-1.5">
      <Text variant={s.price} weight="bold">
        {formatMoney(price)}
      </Text>
      {hasMrp && (
        <Text
          variant={s.mrp}
          tone="muted"
          className="line-through"
          accessibilityLabel={`was ${formatMoney(mrp)}`}>
          {formatMoney(mrp)}
        </Text>
      )}
      {hasMrp && showSaving && (
        <Text variant={s.mrp} weight="semibold" tone="success">
          Save {formatMoney(mrp - price)}
        </Text>
      )}
    </View>
  );
}
