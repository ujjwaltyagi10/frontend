import { router } from 'expo-router';
import { useState } from 'react';
import { Pressable, View } from 'react-native';

import { ServiceArt } from '@/components/service-art';
import { BottomSheet, Button, Icon, icons, Text } from '@/components/ui';
import { useCartDraftStore } from '@/stores';
import { colors, shadows } from '@/theme';

import { useCartQuote } from '../hooks/use-cart-quote';
import { CartItemRow } from './cart-item-row';

const MODE_TITLE = {
  instant: 'Instant booking',
  scheduled: 'Scheduled booking',
  recurring: 'Recurring booking',
} as const;

/**
 * B7 mini cart (as in the reference app): a floating bar above the tab bar once something is in the
 * cart — first item's picture, "N services", their names, Go to cart. Tapping the summary opens
 * Review Services to change minutes or remove items without leaving Home. Names, pictures and
 * prices come from the server quote; nothing is priced here.
 */
export function CartBar() {
  const items = useCartDraftStore((s) => s.items);
  const mode = useCartDraftStore((s) => s.mode);
  const { quote } = useCartQuote();
  const [open, setOpen] = useState(false);

  if (items.length === 0) return null;

  const lineFor = (slug: string) => quote?.lines.find((l) => l.serviceSlug === slug);
  const first = items[0];
  const names = items.map((i) => lineFor(i.serviceSlug)?.name ?? '…').join(', ');
  const count = `${items.length} ${items.length === 1 ? 'service' : 'services'}`;

  return (
    <>
      <View
        className="mx-3 mb-2 flex-row items-center gap-3 rounded-card border border-line bg-card p-2.5"
        style={{ boxShadow: shadows.raised }}
        testID="cart-bar">
        <Pressable
          accessibilityRole="button"
          accessibilityLabel={`${count}: ${names}. Review services`}
          onPress={() => setOpen(true)}
          className="flex-1 flex-row items-center gap-3 active:opacity-70">
          <ServiceArt
            slug={first.serviceSlug}
            imageUrl={lineFor(first.serviceSlug)?.imageUrl}
            size={44}
            rounded="chip"
          />
          <View className="flex-1">
            <View className="flex-row items-center gap-1.5">
              <Text weight="semibold">{count}</Text>
              <Icon name={open ? icons.chevronDown : icons.chevronUp} size={12} color={colors.text.primary} />
            </View>
            <Text variant="caption" tone="muted" numberOfLines={1}>
              {names}
            </Text>
          </View>
        </Pressable>
        <Button title="Go to cart" onPress={() => router.push('/cart')} />
      </View>

      <BottomSheet visible={open} onClose={() => setOpen(false)} title="Review services">
        <View className="rounded-card border border-line bg-card px-4">
          <View className="flex-row items-center justify-between border-b border-line py-3">
            <Text variant="h3">{MODE_TITLE[mode]}</Text>
            <Text variant="caption" tone="muted">
              {count}
            </Text>
          </View>
          {items.map((i) => (
            <CartItemRow
              key={i.serviceSlug}
              serviceSlug={i.serviceSlug}
              durationMin={i.durationMin}
              line={lineFor(i.serviceSlug)}
            />
          ))}
        </View>
        <Button
          title="Go to cart"
          size="lg"
          fullWidth
          onPress={() => {
            setOpen(false);
            router.push('/cart');
          }}
        />
      </BottomSheet>
    </>
  );
}
