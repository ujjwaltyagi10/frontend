import type { ReactNode } from 'react';
import { View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { shadows } from '@/theme';

type Props = {
  /** Left side, e.g. the total. Never shrinks, so a price can't wrap mid-number. */
  summary?: ReactNode;
  /** Right side, usually a `fullWidth` <Button />; takes the remaining width. */
  children: ReactNode;
};

/** Total + primary action pinned above the home indicator (D3, E5). Pass as <Screen footer>. */
export function StickyFooter({ summary, children }: Props) {
  const insets = useSafeAreaInsets();
  return (
    <View
      className="flex-row items-center gap-4 bg-card px-4 pt-3"
      style={{ paddingBottom: Math.max(insets.bottom, 12), boxShadow: shadows.footer }}>
      {summary && <View className="shrink-0">{summary}</View>}
      <View className="flex-1">{children}</View>
    </View>
  );
}
