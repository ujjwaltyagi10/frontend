import { View } from 'react-native';

import type { BookingDetail } from '@/api';
import { BottomSheet, Button, Text } from '@/components/ui';
import { formatMoney } from '@/lib/format';

const INSTANT_TIERS = [
  { percent: 0, when: 'Within 5 minutes of booking', fee: 'Free' },
  { percent: 100, when: 'After that', fee: '100% (up to ₹500)' },
] as const;

const TIERS = [
  { percent: 0, when: 'More than 6 hours before', fee: 'Free' },
  { percent: 50, when: '3–6 hours before', fee: '50% of booking' },
  { percent: 100, when: 'Under 3 hours, or after a professional is assigned', fee: '100% (up to ₹500)' },
] as const;

type Props = {
  booking: BookingDetail;
  visible: boolean;
  onClose: () => void;
  onConfirm: () => void;
  loading: boolean;
};

/** Cancel confirmation: the policy, the tier that applies now, and the exact fee and refund (server's numbers). */
export function CancelSheet({ booking: b, visible, onClose, onConfirm, loading }: Props) {
  const fee = b.cancellationFeePaise ?? 0;
  const refund = b.cancellationRefundPaise ?? 0;
  return (
    <BottomSheet visible={visible} onClose={onClose} title="Cancel this booking?">
      <View className="overflow-hidden rounded-card border border-line">
        {(b.mode === 'instant' ? INSTANT_TIERS : TIERS).map((t, i) => {
          const current = t.percent === b.cancellationFeePercent;
          return (
            <View
              key={t.percent}
              className={`flex-row items-center gap-3 px-3 py-2.5 ${i > 0 ? 'border-t border-line' : ''} ${current ? 'bg-tint' : ''}`}>
              <Text variant="caption" weight={current ? 'semibold' : 'regular'} className="flex-1">
                {t.when}
              </Text>
              <Text variant="caption" weight="semibold" tone={current ? 'accent' : 'muted'}>
                {t.fee}
              </Text>
            </View>
          );
        })}
      </View>
      <View className="gap-1 rounded-card bg-muted p-3">
        <Row label="Cancellation fee" value={fee === 0 ? 'Free' : formatMoney(fee)} />
        <Row label="Back to ChoreDash Money" value={formatMoney(refund)} strong />
      </View>
      <View className="flex-row gap-3">
        <Button title="Keep booking" variant="secondary" className="flex-1" onPress={onClose} />
        <Button
          title="Cancel booking"
          variant="destructive"
          className="flex-1"
          loading={loading}
          onPress={onConfirm}
        />
      </View>
    </BottomSheet>
  );
}

function Row({ label, value, strong = false }: { label: string; value: string; strong?: boolean }) {
  return (
    <View className="flex-row justify-between">
      <Text tone={strong ? 'default' : 'muted'} weight={strong ? 'semibold' : 'regular'}>
        {label}
      </Text>
      <Text weight={strong ? 'bold' : 'regular'}>{value}</Text>
    </View>
  );
}
