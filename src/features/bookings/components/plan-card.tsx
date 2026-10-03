import { useState } from 'react';
import { View } from 'react-native';

import type { RecurringPlan } from '@/api';
import { ServiceArt } from '@/components/service-art';
import { Badge, Button, ConfirmSheet, Text, toast } from '@/components/ui';
import { useStopRecurringPlan } from '@/hooks';
import { track } from '@/lib/analytics';
import { formatDay, formatMoney } from '@/lib/format';
import { useErrorMessage, useTranslation } from '@/lib/i18n';
import { describePlan } from '@/lib/recurrence';

/** A weekly plan in My Bookings: when it repeats, what's in it, the next visit, Stop plan. */
export function PlanCard({ plan }: { plan: RecurringPlan }) {
  const { t } = useTranslation('recurring');
  const stop = useStopRecurringPlan();
  const errorMessage = useErrorMessage();
  const [confirm, setConfirm] = useState(false);
  const active = plan.status === 'active';
  const first = plan.items[0];

  return (
    <View className="gap-3 rounded-card border border-line bg-card p-4">
      <View className="flex-row items-center gap-3">
        {first && <ServiceArt slug={first.serviceSlug} imageUrl={first.imageUrl} size={48} rounded="chip" />}
        <View className="flex-1 gap-0.5">
          <Text weight="semibold">{describePlan(plan.daysOfWeek, plan.slotTime)}</Text>
          <Text variant="caption" tone="muted" numberOfLines={1}>
            {plan.items.map((i) => i.name).join(', ')}
          </Text>
        </View>
        {!active && <Badge label={t('stopped')} tone="neutral" />}
      </View>
      <Text variant="caption" tone="muted">
        {t('perVisit', { amount: formatMoney(plan.perVisitPaise) })}
        {plan.nextVisitAt ? ` · ${t('nextVisit', { date: formatDay(plan.nextVisitAt) })}` : ''}
      </Text>
      {active && (
        <Button title={t('stop')} variant="link" className="self-start" onPress={() => setConfirm(true)} />
      )}
      <ConfirmSheet
        visible={confirm}
        onClose={() => setConfirm(false)}
        title={t('stopTitle')}
        message={t('stopMessage')}
        cancelTitle={t('keep')}
        confirmTitle={t('stop')}
        destructive
        loading={stop.isPending}
        onConfirm={() =>
          stop.mutate(plan.id, {
            onSuccess: () => {
              track('recurring_plan_stopped', {});
              setConfirm(false);
            },
            onError: (e) => toast.error(errorMessage(e)),
          })
        }
      />
    </View>
  );
}
