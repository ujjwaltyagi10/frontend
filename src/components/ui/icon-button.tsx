import { Pressable, type PressableProps } from 'react-native';

import { colors } from '@/theme';

import { Icon, type IconName } from './icon';

type Props = Omit<PressableProps, 'children' | 'style'> & {
  icon: IconName;
  /** Required: icon-only buttons need a screen-reader label (wallet, gift, profile, share…). */
  accessibilityLabel: string;
  variant?: 'plain' | 'filled';
  size?: number;
  className?: string;
};

/** 44×44pt minimum touch target, whatever the icon size. */
export function IconButton({ icon, variant = 'plain', size = 22, className = '', ...rest }: Props) {
  return (
    <Pressable
      accessibilityRole="button"
      hitSlop={4}
      className={`h-11 w-11 items-center justify-center rounded-pill active:opacity-60 ${
        variant === 'filled' ? 'bg-muted' : ''
      } ${rest.disabled ? 'opacity-40' : ''} ${className}`}
      {...rest}>
      <Icon name={icon} size={size} color={colors.text.primary} />
    </Pressable>
  );
}
