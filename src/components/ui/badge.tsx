import { View } from 'react-native';

import { Text, type TextTone } from './text';

const tones = {
  primary: { box: 'bg-tint', text: 'accent' },
  solid: { box: 'bg-primary', text: 'onPrimary' },
  dark: { box: 'bg-dark', text: 'inverse' },
  success: { box: 'bg-success', text: 'inverse' },
  danger: { box: 'bg-danger', text: 'inverse' },
  neutral: { box: 'bg-muted', text: 'default' },
  /** White pill on a cyan surface. */
  light: { box: 'bg-card', text: 'default' },
} as const satisfies Record<string, { box: string; text: TextTone }>;

type Props = { label: string; tone?: keyof typeof tones; className?: string };

/** Small pill label: NEW tag, status chip, bonus "+₹25". */
export function Badge({ label, tone = 'primary', className = '' }: Props) {
  const t = tones[tone];
  return (
    <View className={`self-start rounded-pill px-2 py-0.5 ${t.box} ${className}`}>
      <Text variant="micro" weight="semibold" tone={t.text}>
        {label}
      </Text>
    </View>
  );
}
