import { SymbolView, type SymbolViewProps } from 'expo-symbols';
import type { ColorValue } from 'react-native';

import { colors } from '@/theme';

export type IconName = SymbolViewProps['name'];

type Props = {
  /** SF Symbol on iOS, Material Symbol on Android/web: `{ ios: 'house', android: 'home', web: 'home' }`. */
  name: IconName;
  size?: number;
  color?: ColorValue;
};

/** Decorative icon. For a tappable icon use IconButton (it carries the accessibility label). */
export function Icon({ name, size = 20, color = colors.text.secondary }: Props) {
  return <SymbolView name={name} size={size} tintColor={color} accessible={false} />;
}

/** Icons used in more than one place, so every screen picks the same glyph. */
export const icons = {
  back: { ios: 'chevron.left', android: 'arrow_back', web: 'arrow_back' },
  chevronRight: { ios: 'chevron.right', android: 'chevron_right', web: 'chevron_right' },
  chevronDown: { ios: 'chevron.down', android: 'expand_more', web: 'expand_more' },
  close: { ios: 'xmark', android: 'close', web: 'close' },
  plus: { ios: 'plus', android: 'add', web: 'add' },
  minus: { ios: 'minus', android: 'remove', web: 'remove' },
  check: { ios: 'checkmark', android: 'check', web: 'check' },
  star: { ios: 'star.fill', android: 'star', web: 'star' },
  share: { ios: 'square.and.arrow.up', android: 'share', web: 'share' },
  help: { ios: 'questionmark.circle', android: 'help', web: 'help' },
  wallet: { ios: 'wallet.bifold', android: 'account_balance_wallet', web: 'account_balance_wallet' },
  gift: { ios: 'gift', android: 'redeem', web: 'redeem' },
  profile: { ios: 'person.crop.circle', android: 'account_circle', web: 'account_circle' },
  location: { ios: 'location.fill', android: 'my_location', web: 'my_location' },
  info: { ios: 'info.circle', android: 'info', web: 'info' },
  warning: { ios: 'exclamationmark.triangle', android: 'warning', web: 'warning' },
} as const satisfies Record<string, IconName>;
