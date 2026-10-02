import type { ReactNode } from 'react';
import { View } from 'react-native';
import { SafeAreaView, type Edge } from 'react-native-safe-area-context';

import { RefreshScrollView } from './refresh-scroll-view';

type ScreenProps = {
  children: ReactNode;
  /** Scrollable body (default) or a fixed layout. */
  scroll?: boolean;
  /** Sticky content under the body, e.g. a StickyFooter. */
  footer?: ReactNode;
  edges?: Edge[];
  /** Pull to refresh (scrolling screens only). Old data stays on screen while it runs. */
  onRefresh?: () => void;
  refreshing?: boolean;
  /** Screen ID from the Screen Flow doc (A1, B1…); used as testID. */
  testID?: string;
};

/** Page shell: Bianca background, safe areas, 16pt gutter. */
export function Screen({
  children,
  scroll = true,
  footer,
  edges = ['top'],
  onRefresh,
  refreshing = false,
  testID,
}: ScreenProps) {
  return (
    <SafeAreaView edges={edges} className="flex-1 bg-page" testID={testID}>
      {scroll ? (
        <RefreshScrollView
          contentContainerClassName="gap-4 p-4"
          keyboardShouldPersistTaps="handled"
          onRefresh={onRefresh}
          refreshing={refreshing}>
          {children}
        </RefreshScrollView>
      ) : (
        <View className="flex-1 gap-4 p-4">{children}</View>
      )}
      {footer}
    </SafeAreaView>
  );
}
