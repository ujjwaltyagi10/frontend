import { useState } from 'react';
import { Pressable, View } from 'react-native';
import Animated, { FadeIn } from 'react-native-reanimated';

import { colors } from '@/theme';

import { Icon, icons } from './icon';
import { Text } from './text';

type Item = { question: string; answer: string };

/** Expandable FAQ rows (C2, E3–E4). One open at a time keeps long lists scannable. */
export function Accordion({ items }: { items: Item[] }) {
  const [open, setOpen] = useState<number | null>(null);
  return (
    <View>
      {items.map((item, i) => {
        const expanded = open === i;
        return (
          <View key={item.question} className="border-b border-line">
            <Pressable
              accessibilityRole="button"
              accessibilityState={{ expanded }}
              onPress={() => setOpen(expanded ? null : i)}
              className="min-h-12 flex-row items-center gap-3 py-3 active:opacity-60">
              <Text weight="medium" className="flex-1">
                {item.question}
              </Text>
              <Icon name={expanded ? icons.minus : icons.plus} size={14} color={colors.text.secondary} />
            </Pressable>
            {expanded && (
              <Animated.View entering={FadeIn} className="pb-3">
                <Text tone="muted">{item.answer}</Text>
              </Animated.View>
            )}
          </View>
        );
      })}
    </View>
  );
}
