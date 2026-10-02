import { Image } from 'expo-image';
import { View } from 'react-native';

import { serviceArtwork } from '@/components/illustrations';
import { Icon, type IconName } from '@/components/ui';
import { colors, radius as radii } from '@/theme';

// Last resort for a service with neither a CDN image nor bundled art: one glyph per service.
const ICONS: Record<string, IconName> = {
  hourly: { ios: 'clock', android: 'schedule', web: 'schedule' },
  'festive-home-help': { ios: 'sparkles', android: 'auto_awesome', web: 'auto_awesome' },
  'packing-unpacking': { ios: 'shippingbox', android: 'inventory_2', web: 'inventory_2' },
  dusting: { ios: 'wind', android: 'air', web: 'air' },
  'sweeping-mopping': { ios: 'bubbles.and.sparkles', android: 'cleaning_services', web: 'cleaning_services' },
  bathroom: { ios: 'shower', android: 'shower', web: 'shower' },
  utensils: { ios: 'fork.knife', android: 'restaurant', web: 'restaurant' },
  fridge: { ios: 'refrigerator', android: 'kitchen', web: 'kitchen' },
  kitchen: { ios: 'frying.pan', android: 'countertops', web: 'countertops' },
  'kitchen-cabinets': { ios: 'cabinet', android: 'shelves', web: 'shelves' },
  wardrobe: { ios: 'tshirt', android: 'checkroom', web: 'checkroom' },
  laundry: { ios: 'washer', android: 'local_laundry_service', web: 'local_laundry_service' },
};
const FALLBACK: IconName = { ios: 'house', android: 'home', web: 'home' };

type Props = {
  slug: string;
  imageUrl?: string | null;
  /** Width; height follows `aspectRatio`. Omit to fill the parent's width. */
  size?: number;
  aspectRatio?: number;
  /** `none` when the art sits flush inside a card that clips it. */
  rounded?: keyof typeof radii | 'none';
};

/** A service's picture: the CDN image, else the bundled 3D art, else a grey tile with its icon. */
export function ServiceArt({ slug, imageUrl, size, aspectRatio = 1, rounded = 'card' }: Props) {
  const box = {
    width: size ?? ('100%' as const),
    aspectRatio,
    borderRadius: rounded === 'none' ? 0 : radii[rounded],
  };
  const source = imageUrl || serviceArtwork[slug];
  if (source) {
    return (
      <Image
        source={source}
        style={{ ...box, backgroundColor: colors.surface.muted }}
        contentFit="cover"
        transition={150}
        accessible={false}
      />
    );
  }
  const iconSize = size ? Math.round(size * 0.42) : 36;
  return (
    <View
      style={{ ...box, backgroundColor: colors.surface.muted }}
      className="items-center justify-center"
      accessible={false}>
      <Icon name={ICONS[slug] ?? FALLBACK} size={iconSize} color={colors.text.secondary} />
    </View>
  );
}
