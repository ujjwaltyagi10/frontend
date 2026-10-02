import { Pressable, View } from 'react-native';

import { Badge, Icon, icons, ListGroup, Text, type IconName } from '@/components/ui';
import { colors } from '@/theme';

import type { GatewayMethod, UpiApp } from '../gateway';

const UPI_APPS: { app: UpiApp; name: string }[] = [
  { app: 'phonepe', name: 'PhonePe' },
  { app: 'gpay', name: 'Google Pay' },
  { app: 'paytm', name: 'Paytm' },
  { app: 'slice', name: 'slice' },
  { app: 'supermoney', name: 'super.money' },
];

const same = (a: GatewayMethod | null, b: GatewayMethod) =>
  !!a && a.kind === b.kind && (a.kind !== 'upi_app' || (b.kind === 'upi_app' && a.app === b.app));

type Props = { value: GatewayMethod | null; onChange: (m: GatewayMethod) => void };

/** F4 payment methods (PY-2, PY-6): one selectable row per method, grouped by kind. */
export function MethodList({ value, onChange }: Props) {
  return (
    <View className="gap-5">
      {/* TODO(CD-046): list only installed apps (Linking.canOpenURL) once Razorpay is in. */}
      <ListGroup title="UPI">
        {UPI_APPS.map(({ app, name }) => (
          <MethodRow
            key={app}
            label={name}
            avatar={name[0].toUpperCase()}
            selected={same(value, { kind: 'upi_app', app })}
            onPress={() => onChange({ kind: 'upi_app', app })}
          />
        ))}
        <MethodRow
          label="Any UPI app"
          sub="Pay with a UPI ID or another app"
          icon={{ ios: 'at', android: 'alternate_email', web: 'alternate_email' }}
          selected={same(value, { kind: 'upi_any' })}
          onPress={() => onChange({ kind: 'upi_any' })}
        />
      </ListGroup>

      <ListGroup title="Cards">
        <MethodRow
          label="Credit / debit card"
          sub="Visa, Mastercard, RuPay"
          icon={{ ios: 'creditcard', android: 'credit_card', web: 'credit_card' }}
          selected={same(value, { kind: 'card' })}
          onPress={() => onChange({ kind: 'card' })}
        />
      </ListGroup>

      <ListGroup title="ChoreDash Money">
        {/* PY-6 Quick Checkout from the wallet: CD-055. */}
        <MethodRow
          label="Pay from wallet balance"
          icon={icons.wallet}
          disabled
          trailing={<Badge label="Soon" tone="neutral" />}
        />
      </ListGroup>
    </View>
  );
}

type RowProps = {
  label: string;
  sub?: string;
  /** Letter avatar (UPI apps) or an icon. */
  avatar?: string;
  icon?: IconName;
  selected?: boolean;
  disabled?: boolean;
  onPress?: () => void;
  trailing?: React.ReactNode;
};

function MethodRow({
  label,
  sub,
  avatar,
  icon,
  selected = false,
  disabled = false,
  onPress,
  trailing,
}: RowProps) {
  return (
    <Pressable
      accessibilityRole="radio"
      accessibilityState={{ checked: selected, disabled }}
      accessibilityLabel={sub ? `${label}, ${sub}` : label}
      disabled={disabled}
      onPress={onPress}
      className={`min-h-14 flex-row items-center gap-3 px-4 py-3 ${selected ? 'bg-tint' : ''} ${
        disabled ? 'opacity-50' : 'active:bg-muted'
      }`}>
      <View className="h-9 w-9 items-center justify-center rounded-pill bg-muted">
        {avatar ? (
          <Text weight="bold">{avatar}</Text>
        ) : (
          icon && <Icon name={icon} size={18} color={colors.text.primary} />
        )}
      </View>
      <View className="flex-1">
        <Text weight="medium">{label}</Text>
        {sub && (
          <Text variant="caption" tone="muted">
            {sub}
          </Text>
        )}
      </View>
      {trailing ?? <Radio selected={selected} />}
    </Pressable>
  );
}

function Radio({ selected }: { selected: boolean }) {
  return (
    <View
      className={`h-6 w-6 items-center justify-center rounded-pill border-2 ${
        selected ? 'border-primary-strong bg-primary-strong' : 'border-line-strong bg-card'
      }`}>
      {selected && <Icon name={icons.check} size={12} color={colors.brand.onDark} />}
    </View>
  );
}
