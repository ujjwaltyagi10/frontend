import { Pressable, View } from 'react-native';

import { shadows } from '@/theme';

import { Text } from './text';

type Option<T extends string> = { value: T; label: string };

type Props<T extends string> = {
  options: readonly Option<T>[];
  value: T;
  onChange: (value: T) => void;
};

/** 2–3 option switch: Upcoming/Previous (G1), Instant/Scheduled/Recurring (D2). */
export function SegmentedTabs<T extends string>({ options, value, onChange }: Props<T>) {
  return (
    <View accessibilityRole="tablist" className="flex-row rounded-pill bg-muted p-1">
      {options.map((o) => {
        const selected = o.value === value;
        return (
          <Pressable
            key={o.value}
            accessibilityRole="tab"
            accessibilityState={{ selected }}
            onPress={() => onChange(o.value)}
            style={selected ? { boxShadow: shadows.raised } : undefined}
            className={`min-h-10 flex-1 items-center justify-center rounded-pill px-3 ${
              selected ? 'bg-card' : 'active:opacity-60'
            }`}>
            <Text variant="caption" weight="semibold" tone={selected ? 'default' : 'muted'}>
              {o.label}
            </Text>
          </Pressable>
        );
      })}
    </View>
  );
}
