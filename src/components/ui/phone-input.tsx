import { PHONE_COUNTRY_CODE, PHONE_LENGTH } from '@/config/constants';

import { Input, type InputProps } from './input';
import { Text } from './text';

type Props = Omit<InputProps, 'value' | 'onChangeText' | 'prefix' | 'keyboardType'> & {
  value: string;
  onChangeText: (digits: string) => void;
};

/** A7 — "+91" prefix, digits only, max 10. `isValidPhone` checks the Indian mobile format. */
export function PhoneInput({ value, onChangeText, ...rest }: Props) {
  return (
    <Input
      value={value}
      onChangeText={(v) => onChangeText(v.replace(/\D/g, '').slice(0, PHONE_LENGTH))}
      keyboardType="number-pad"
      autoComplete="tel-national"
      textContentType="telephoneNumber"
      maxLength={PHONE_LENGTH}
      prefix={<Text weight="semibold">{PHONE_COUNTRY_CODE}</Text>}
      {...rest}
    />
  );
}

export const isValidPhone = (digits: string) => /^[6-9]\d{9}$/.test(digits);
