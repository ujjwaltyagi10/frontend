import { Pressable, View } from 'react-native';

import { Icon, icons, ListGroup, Text, type IconName } from '@/components/ui';
import { formatMoney } from '@/lib/format';
import { colors } from '@/theme';

import type { PayMethod, UpiApp } from '../gateway';

const UPI_APPS: { app: UpiApp; name: string }[] = [
  { app: 'phonepe', name: 'PhonePe' },
  { app: 'gpay', name: 'Google Pay' },
  { app: 'paytm', name: 'Paytm' },
  { app: 'slice', name: 'slice' },
  { app: 'supermoney', name: 'super.money' },
];

const same = (a: PayMethod | null, b: PayMethod) =>
  !!a && a.kind === b.kind && (a.kind !== 'upi_app' || (b.kind === 'upi_app' && a.app === b.app));

type Props = {
  value: PayMethod | null;
  onChange: (m: PayMethod) => void;
  /** ChoreDash Money for this payment: null hides it (top-ups, Pass), undefined = balance loading. */
  wallet?: { balancePaise: number | undefined; amountPaise: number } | null;
};

/** F4 payment methods (PY-2, PY-6): one selectable row per method, grouped by kind. */
export function MethodList({ value, onChange, wallet = null }: Props) {
  const balance = wallet?.balancePaise;
  const enough = wallet && balance !== undefined && balance >= wallet.amountPaise;
  return (
    <View className="gap-5">
      {wallet && (
        // First: one tap, no app switch (PY-6).
        <ListGroup title="ChoreDash Money">
          <MethodRow
            label="Pay from wallet"
            sub={
              balance === undefined
                ? 'Checking balance…'
                : enough
                  ? `Balance ${formatMoney(balance)}`
                  : `Balance ${formatMoney(balance)} · not enough for this booking`
            }
            icon={icons.wallet}
            disabled={!enough}
            selected={same(value, { kind: 'wallet' })}
            onPress={() => onChange({ kind: 'wallet' })}
          />
        </ListGroup>
      )}
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
