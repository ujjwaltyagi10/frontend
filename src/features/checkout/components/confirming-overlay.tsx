import { ActivityIndicator, View } from 'react-native';

import { Text } from '@/components/ui';
import { colors } from '@/theme';

/** Full-screen dimmed loader while we wait for the bank (one of only two places it's allowed). */
export function ConfirmingOverlay() {
  return (
    <View
      className="absolute inset-0 items-center justify-center gap-3 bg-page/90"
      accessibilityViewIsModal
      accessibilityLiveRegion="polite">
      <ActivityIndicator size="large" color={colors.text.primary} />
      <Text variant="h3">Confirming your payment…</Text>
      <Text tone="muted" className="px-8 text-center">
        Please don&apos;t close the app. This usually takes a few seconds.
      </Text>
    </View>
  );
}
