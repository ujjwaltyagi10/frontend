import { View } from 'react-native';

import { Text } from './text';

type Step = string | { title: string; body?: string };

/** Numbered "How it works" / "How it's done" steps (C2, E2): mustard number, title, optional detail. */
export function Steps({ steps }: { steps: Step[] }) {
  return (
    <View className="gap-3">
      {steps.map((step, i) => {
        const { title, body } = typeof step === 'string' ? { title: step, body: undefined } : step;
        return (
          <View
            key={title}
            className="flex-row gap-3"
            accessibilityLabel={`Step ${i + 1}: ${title}${body ? `. ${body}` : ''}`}>
            <View className="h-7 w-7 items-center justify-center rounded-pill bg-muted">
              <Text variant="caption" weight="bold" tone="accent">
                {i + 1}
              </Text>
            </View>
            <View className="flex-1 justify-center gap-0.5">
              <Text weight={body ? 'semibold' : 'regular'}>{title}</Text>
              {body && (
                <Text variant="caption" tone="muted">
                  {body}
                </Text>
              )}
            </View>
          </View>
        );
      })}
    </View>
  );
}
