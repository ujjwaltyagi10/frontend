import { Text as RNText, type TextProps as RNTextProps } from 'react-native';

import type { FontWeight } from '@/theme';

const variants = {
  display: { size: 'text-display', weight: 'bold' },
  h1: { size: 'text-h1', weight: 'bold' },
  h2: { size: 'text-h2', weight: 'semibold' },
  h3: { size: 'text-h3', weight: 'semibold' },
  body: { size: 'text-body', weight: 'regular' },
  caption: { size: 'text-caption', weight: 'regular' },
  micro: { size: 'text-micro', weight: 'medium' },
} as const satisfies Record<string, { size: string; weight: FontWeight }>;

const weights: Record<FontWeight, string> = {
  regular: 'font-regular',
  medium: 'font-medium',
  semibold: 'font-semibold',
  bold: 'font-bold',
};

const tones = {
  default: 'text-fg',
  muted: 'text-fg-muted',
  inverse: 'text-fg-inverse',
  onPrimary: 'text-on-primary',
  /** Subtitles on cyan cards (zinc-100). */
  onPrimaryMuted: 'text-on-primary-muted',
  /** Dark cyan: cyan text on white/tint (links, selected states, small highlights). */
  accent: 'text-primary-strong',
  /** Bright cyan — large display figures (wallet balance, amount to pay); small text on white uses `accent`. */
  brand: 'text-primary',
  danger: 'text-danger',
  success: 'text-success',
  info: 'text-info',
} as const;

export type TextVariant = keyof typeof variants;
export type TextTone = keyof typeof tones;

export type TextProps = RNTextProps & {
  variant?: TextVariant;
  /** Defaults to the variant's weight. Never set weight with className. */
  weight?: FontWeight;
  tone?: TextTone;
  /** Layout and decoration only (margins, alignment, line-through). */
  className?: string;
};

/** The only text component screens use, so type scale, weight and colour stay on-token. */
export function Text({ variant = 'body', weight, tone = 'default', className = '', ...rest }: TextProps) {
  const v = variants[variant];
  return (
    <RNText className={`${v.size} ${weights[weight ?? v.weight]} ${tones[tone]} ${className}`} {...rest} />
  );
}
