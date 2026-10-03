import { useState } from 'react';
import { ActivityIndicator, Pressable, View } from 'react-native';

import type { CartQuote } from '@/api';
import { Card, Icon, icons, Text } from '@/components/ui';
import { formatDuration, formatMoney } from '@/lib/format';
import { colors } from '@/theme';

function Row({ label, value, tone }: { label: string; value: string; tone?: 'success' | 'muted' }) {
  return (
    <View className="flex-row justify-between">
      <Text tone={tone === 'muted' ? 'muted' : 'default'}>{label}</Text>
      <Text tone={tone ?? 'default'}>{value}</Text>
    </View>
  );
}

/** D3/D5 bill: item total, discount, GST & fees, to pay, savings. Collapsible; spinner while re-quoting. */
export function BillCard({ quote, isStale }: { quote: CartQuote; isStale: boolean }) {
  const [open, setOpen] = useState(true);
  return (
    <Card>
      <Pressable
        accessibilityRole="button"
        accessibilityState={{ expanded: open }}
        onPress={() => setOpen((o) => !o)}
        className="min-h-11 flex-row items-center justify-between">
        <Text variant="h3">Bill details</Text>
        <Icon name={open ? icons.chevronDown : icons.chevronRight} size={14} />
      </Pressable>
      {open && (
        <View className="gap-2">
          <Row label="Item total" value={formatMoney(quote.itemTotalPaise)} />
          {quote.pass && (
            <Row
              label={`ChoreDash Pass · ${formatDuration(quote.pass.minutesCovered)}`}
              value={`−${formatMoney(quote.pass.discountPaise)}`}
              tone="success"
            />
          )}
          {quote.discountPaise > 0 && (
            <Row
              label={`Coupon ${quote.coupon?.code ?? ''}`}
              value={`−${formatMoney(quote.discountPaise)}`}
              tone="success"
            />
          )}
          <Row label="GST & service fees" value={formatMoney(quote.feesPaise)} tone="muted" />
        </View>
      )}
      <View className="flex-row items-center justify-between border-t border-line pt-3">
        <Text weight="semibold">To pay</Text>
        <View className="flex-row items-center gap-2">
          {isStale && (
            <ActivityIndicator
              size="small"
              color={colors.text.secondary}
              accessibilityLabel="Updating price"
            />
          )}
          <Text weight="bold" className={isStale ? 'opacity-40' : ''}>
            {formatMoney(quote.totalPaise)}
          </Text>
        </View>
      </View>
      {quote.savingsPaise > 0 && (
        <View className="rounded-chip bg-tint px-3 py-2">
          <Text variant="caption" weight="semibold" tone="success">
            You save {formatMoney(quote.savingsPaise)} on this booking
          </Text>
        </View>
      )}
    </Card>
  );
}
