import { ActivityIndicator, View } from 'react-native';

import { useErrorMessage, useTranslation } from '@/lib/i18n';
import { colors } from '@/theme';

import { Button } from './button';
import { Text } from './text';

type Props = { state: 'loading' } | { state: 'error'; error: unknown; onRetry?: () => void };

/**
 * Full-area loading or blocking error (Frontend Spec → States). Main screens should use
 * content-shaped <Skeleton> for first loads; empty results use <EmptyState>.
 */
export function StateView(props: Props) {
  const { t } = useTranslation();
  const errorMessage = useErrorMessage();
  return (
    <View className="flex-1 items-center justify-center gap-3 p-6">
      {props.state === 'loading' ? (
        <ActivityIndicator color={colors.text.primary} accessibilityLabel="Loading" />
      ) : (
        <>
          <Text className="text-center">{errorMessage(props.error)}</Text>
          {props.onRetry && (
            <Button title={t('actions.retry')} className="self-center" onPress={props.onRetry} />
          )}
        </>
      )}
    </View>
  );
}
