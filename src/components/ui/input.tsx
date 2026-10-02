import type { ReactNode, Ref } from 'react';
import { TextInput, View, type TextInputProps } from 'react-native';

import { colors, fontFamily, fontSize } from '@/theme';

import { Text } from './text';

export type InputProps = Omit<TextInputProps, 'style'> & {
  label?: string;
  hint?: string;
  /** Shown under the field in red; also turns the border red. */
  error?: string | null;
  /** Fixed text before the input, e.g. "+91". */
  prefix?: ReactNode;
  ref?: Ref<TextInput>;
  className?: string;
};

export function Input({
  label,
  hint,
  error,
  prefix,
  ref,
  className = '',
  editable = true,
  ...rest
}: InputProps) {
  return (
    <View className={`gap-1 ${className}`}>
      {label && (
        <Text variant="caption" weight="medium" tone="muted">
          {label}
        </Text>
      )}
      <View
        className={`min-h-12 flex-row items-center gap-2 rounded-card border bg-card px-4 ${
          error ? 'border-danger' : 'border-line'
        } ${editable ? '' : 'opacity-60'}`}>
        {prefix}
        <TextInput
          ref={ref}
          editable={editable}
          placeholderTextColor={colors.text.secondary}
          accessibilityLabel={label ?? rest.placeholder}
          accessibilityHint={error ?? hint}
          className="flex-1 py-3 text-fg"
          // No lineHeight on TextInput: iOS pushes the text down, misaligning it with `prefix`.
          style={{ fontFamily: fontFamily.regular, fontSize: fontSize.body[0] }}
          {...rest}
        />
      </View>
      {error ? (
        <Text variant="caption" tone="danger" accessibilityLiveRegion="polite">
          {error}
        </Text>
      ) : hint ? (
        <Text variant="caption" tone="muted">
          {hint}
        </Text>
      ) : null}
    </View>
  );
}
