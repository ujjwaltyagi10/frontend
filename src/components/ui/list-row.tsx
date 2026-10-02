import { Children, Fragment, isValidElement, type ReactNode } from 'react';
import { Pressable, View } from 'react-native';

import { colors } from '@/theme';

import { Icon, icons, type IconName } from './icon';
import { Text } from './text';

type Props = {
  title: string;
  subtitle?: string;
  icon?: IconName;
  onPress?: () => void;
  destructive?: boolean;
  /** Trailing text before the chevron, e.g. a balance or "3 left". */
  value?: string;
  /** Hide the trailing chevron (e.g. for rows that open a sheet). */
  showChevron?: boolean;
};

/** Menu row with icon, title and chevron (H2). Put rows in a <ListGroup>, which draws the box and hairlines. */
export function ListRow({
  title,
  subtitle,
  icon,
  onPress,
  destructive = false,
  value,
  showChevron = true,
}: Props) {
  const tint = destructive ? colors.danger : colors.text.secondary;
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={subtitle ? `${title}, ${subtitle}` : title}
      onPress={onPress}
      disabled={!onPress}
      className="min-h-14 flex-row items-center gap-3 px-4 py-3 active:bg-muted">
      {icon && (
        <View className="h-9 w-9 items-center justify-center rounded-chip bg-muted">
          <Icon name={icon} size={18} color={tint} />
        </View>
      )}
      <View className="flex-1">
        <Text weight="medium" tone={destructive ? 'danger' : 'default'}>
          {title}
        </Text>
        {subtitle && (
          <Text variant="caption" tone="muted">
            {subtitle}
          </Text>
        )}
      </View>
      {value && (
        <Text variant="caption" tone="muted">
          {value}
        </Text>
      )}
      {showChevron && onPress && <Icon name={icons.chevronRight} size={14} color={colors.icon} />}
    </Pressable>
  );
}

/**
 * iOS-Settings-style group: optional small caps title, one white rounded box, hairlines between
 * rows (inset past the icon). Groups — not a card per row — keep long menus calm.
 */
export function ListGroup({ title, children }: { title?: string; children: ReactNode }) {
  const rows = Children.toArray(children).filter(isValidElement);
  return (
    <View className="gap-2">
      {title && (
        <Text variant="micro" tone="muted" className="px-1 uppercase tracking-wide">
          {title}
        </Text>
      )}
      <View className="overflow-hidden rounded-card border border-line bg-card">
        {rows.map((row, i) => (
          <Fragment key={row.key ?? i}>
            {i > 0 && <View className="ml-16 h-px bg-line" />}
            {row}
          </Fragment>
        ))}
      </View>
    </View>
  );
}
