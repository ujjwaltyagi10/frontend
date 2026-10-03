import { Pressable } from 'react-native';

import { Text } from './text';

type Props = {
  label: string;
  selected?: boolean;
  disabled?: boolean;
  onPress?: () => void;
  /** Secondary line, e.g. a price or "+₹25 bonus". */
  sublabel?: string;
  /** Share a row equally with sibling chips (weekday picker). */
  fill?: boolean;
};

/** Selectable chip: day picker (D1), duration chips, amount presets (F1). Cyan tint when selected. */
export function Chip({ label, sublabel, selected = false, disabled = false, fill = false, onPress }: Props) {
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityState={{ selected, disabled }}
      disabled={disabled}
      onPress={onPress}
      className={`min-h-11 items-center justify-center rounded-chip border py-2 ${fill ? 'flex-1 px-1' : 'px-4'} ${
        selected ? 'border-primary-strong bg-tint' : 'border-line bg-card'
      } ${disabled ? 'opacity-40' : 'active:opacity-70'}`}>
      <Text variant="caption" weight="semibold" tone={selected ? 'accent' : 'default'}>
        {label}
      </Text>
      {sublabel && (
        <Text variant="micro" tone={selected ? 'accent' : 'muted'}>
          {sublabel}
        </Text>
      )}
    </Pressable>
  );
}
