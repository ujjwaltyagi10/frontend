import type { ReactNode } from 'react';
import { View } from 'react-native';

import { Button } from './button';
import { Text } from './text';

type Props = {
  title: string;
  message?: string;
  /** Illustration slot (Q-33: illustration set not chosen yet). */
  illustration?: ReactNode;
  actionTitle?: string;
  onAction?: () => void;
};

/** One line, optional illustration, and the next action (G1 "No bookings found", D1 no slots). */
export function EmptyState({ title, message, illustration, actionTitle, onAction }: Props) {
  return (
    <View className="items-center gap-3 px-6 py-10">
      {illustration}
      <Text variant="h3" className="text-center">
        {title}
      </Text>
      {message && (
        <Text tone="muted" className="text-center">
          {message}
        </Text>
      )}
      {actionTitle && onAction && (
        <Button title={actionTitle} onPress={onAction} className="mt-1 self-center" />
      )}
    </View>
  );
}
