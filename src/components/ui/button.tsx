import type { ReactNode } from 'react';
import { ActivityIndicator, Pressable, View, type PressableProps } from 'react-native';

import { colors } from '@/theme';

import { Text, type TextTone } from './text';

const variants = {
  primary: { box: 'bg-primary', tone: 'onPrimary', spinner: colors.brand.onPrimary },
  secondary: { box: 'border border-line-strong bg-card', tone: 'default', spinner: colors.text.primary },
  dark: { box: 'bg-dark', tone: 'inverse', spinner: colors.brand.onDark },
  ghost: { box: 'bg-transparent', tone: 'default', spinner: colors.text.primary },
  /** Text-only action in the brand colour ("Enter location manually"). */
  link: { box: 'bg-transparent', tone: 'accent', spinner: colors.brand.primaryStrong },
  destructive: { box: 'border border-danger bg-card', tone: 'danger', spinner: colors.danger },
} as const satisfies Record<string, { box: string; tone: TextTone; spinner: string }>;

const sizes = {
  sm: { box: 'min-h-11 px-3 rounded-chip', text: 'caption' },
  md: { box: 'min-h-12 px-5 rounded-card', text: 'body' },
  lg: { box: 'min-h-14 px-6 rounded-card', text: 'h3' },
} as const;

export type ButtonProps = Omit<PressableProps, 'children' | 'style'> & {
  title: string;
  variant?: keyof typeof variants;
  size?: keyof typeof sizes;
  loading?: boolean;
  fullWidth?: boolean;
  /** Optional leading element, e.g. an <Icon />. */
  icon?: ReactNode;
  /** Layout only (margins, flex). Colours come from `variant`. */
  className?: string;
};

export function Button({
  title,
  variant = 'primary',
  size = 'md',
  loading = false,
  disabled,
  fullWidth = false,
  icon,
  className = '',
  ...rest
}: ButtonProps) {
  const v = variants[variant];
  const s = sizes[size];
  const isDisabled = disabled || loading;
  // A caller's own `self-*` must win; two self-* classes would race on stylesheet order.
  const align = /\bself-/.test(className) ? '' : fullWidth ? 'self-stretch' : 'self-start';
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={title}
      accessibilityState={{ disabled: !!isDisabled, busy: loading }}
      disabled={isDisabled}
      className={`flex-row items-center justify-center gap-2 ${s.box} ${v.box} ${align} ${
        isDisabled ? 'opacity-40' : 'active:opacity-70'
      } ${className}`}
      {...rest}>
      {loading ? (
        <ActivityIndicator color={v.spinner} />
      ) : (
        <>
          {icon && <View>{icon}</View>}
          <Text variant={s.text} weight="semibold" tone={v.tone} numberOfLines={1}>
            {title}
          </Text>
        </>
      )}
    </Pressable>
  );
}
