import { useRef, type Ref } from 'react';
import { Pressable, TextInput, View } from 'react-native';

import { OTP_LENGTH } from '@/config/constants';

import { Text } from './text';

type Props = {
  value: string;
  onChangeText: (digits: string) => void;
  /** Called once when the last digit is entered (auto-submit, A8 → A9). */
  onComplete?: (code: string) => void;
  error?: boolean;
  disabled?: boolean;
  length?: number;
  ref?: Ref<TextInput>;
};

/**
 * A8/A11 OTP boxes. One hidden TextInput drives all boxes, so paste and SMS autofill
 * (iOS one-time-code, Android sms-otp) work, and screen readers hear a single field.
 */
export function OtpInput({
  value,
  onChangeText,
  onComplete,
  error,
  disabled,
  length = OTP_LENGTH,
  ref,
}: Props) {
  const inner = useRef<TextInput>(null);

  const handleChange = (raw: string) => {
    const digits = raw.replace(/\D/g, '').slice(0, length);
    onChangeText(digits);
    if (digits.length === length && value.length !== length) onComplete?.(digits);
  };

  return (
    <Pressable onPress={() => inner.current?.focus()} accessible={false}>
      <View className="flex-row justify-between gap-2" pointerEvents="none">
        {Array.from({ length }, (_, i) => {
          const active = !disabled && i === Math.min(value.length, length - 1);
          return (
            <View
              key={i}
              className={`h-14 flex-1 items-center justify-center rounded-card border-2 bg-card ${
                error ? 'border-danger' : active ? 'border-primary-strong' : 'border-line'
              }`}>
              <Text variant="h2">{value[i] ?? ''}</Text>
            </View>
          );
        })}
      </View>
      <TextInput
        ref={(node) => {
          inner.current = node;
          if (typeof ref === 'function') ref(node);
          else if (ref) ref.current = node;
        }}
        value={value}
        onChangeText={handleChange}
        editable={!disabled}
        autoFocus
        keyboardType="number-pad"
        textContentType="oneTimeCode"
        autoComplete="sms-otp"
        maxLength={length}
        caretHidden
        accessibilityLabel={`One-time password, ${length} digits`}
        accessibilityState={{ disabled }}
        testID="otp-input"
        className="absolute inset-0 opacity-0"
      />
    </Pressable>
  );
}
