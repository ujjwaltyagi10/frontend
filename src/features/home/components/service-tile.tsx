import { Link } from 'expo-router';
import { Pressable, View } from 'react-native';

import type { ServiceSummary } from '@/api';
import { ServiceArt } from '@/components/service-art';
import { Badge, Icon, icons, PriceText, Skeleton, Text } from '@/components/ui';
import { track } from '@/lib/analytics';
import { useCartDraftStore, useLocationStore } from '@/stores';
import { colors, shadows } from '@/theme';

/** B2–B3 grid tile: image, rating, NEW tag, price + MRP, quick-add "+". */
export function ServiceTile({ service }: { service: ServiceSummary }) {
  const inCart = useCartDraftStore((s) => s.items.some((i) => i.serviceSlug === service.slug));
  const addItem = useCartDraftStore((s) => s.addItem);
  // B6: tiles still open details in an unserved area, but nothing can be added.
  const serviceable = useLocationStore((s) => s.location?.serviceable ?? false);

  const quickAdd = () => {
    addItem(service.slug, service.defaultDurationMin);
    track('cart_item_added', {
      service_slug: service.slug,
      duration_min: service.defaultDurationMin,
      source: 'tile',
    });
  };

  return (
    <View className="w-[31%] overflow-hidden rounded-card border border-line bg-card">
      <Link href={{ pathname: '/service/[slug]', params: { slug: service.slug } }} asChild>
        <Pressable accessibilityLabel={service.name} className="active:opacity-80">
          <View className="bg-muted">
            <ServiceArt slug={service.slug} imageUrl={service.imageUrl} rounded="none" />
            {service.isNew && <Badge label="NEW" tone="danger" className="absolute left-1.5 top-1.5" />}
            <View className="absolute right-1.5 top-1.5 flex-row items-center gap-0.5 rounded-pill bg-card px-1.5 py-0.5">
              <Icon name={icons.star} size={10} color={colors.rating} />
              <Text variant="micro">{service.rating.toFixed(1)}</Text>
            </View>
            {serviceable && (
              <Pressable
                accessibilityRole="button"
                accessibilityLabel={inCart ? `${service.name} added to cart` : `Add ${service.name} to cart`}
                accessibilityState={{ disabled: inCart }}
                disabled={inCart}
                onPress={quickAdd}
                hitSlop={6}
                style={{ boxShadow: shadows.raised }}
                className={`absolute bottom-1.5 right-1.5 h-10 w-10 items-center justify-center rounded-card ${
                  inCart ? 'bg-tint' : 'bg-card'
                } active:opacity-70`}>
                <Icon name={inCart ? icons.check : icons.plus} size={18} color={colors.brand.primaryStrong} />
              </Pressable>
            )}
          </View>
          <View className="gap-1 px-2.5 pb-3 pt-2.5">
            <Text weight="medium" numberOfLines={2}>
              {service.name}
            </Text>
            <PriceText price={service.pricePaise} mrp={service.mrpPaise} />
          </View>
        </Pressable>
      </Link>
    </View>
  );
}

/** Same footprint as a tile, for the B5 skeleton. */
export function ServiceTileSkeleton() {
  return (
    <View className="w-[31%] gap-1.5">
      <Skeleton aspectRatio={1} rounded="card" />
      <Skeleton width="80%" height={12} />
      <Skeleton width="50%" height={12} />
    </View>
  );
}
