import { router } from 'expo-router';
import { useMemo, useState } from 'react';
import { View } from 'react-native';

import { Banner, Button, Card, Chip, Screen, Skeleton, StickyFooter, Text } from '@/components/ui';
import { useWalletSummary } from '@/hooks';
import { formatDay, formatMoney, istDateKey } from '@/lib/format';
import { useTranslation } from '@/lib/i18n';
import { selectTotalMinutes, useCartDraftStore, useLocationStore, useSessionStore } from '@/stores';

import { useCartQuote } from '../hooks/use-cart-quote';
import { useSlots } from '../hooks/use-slots';
import { describePlan, firstVisitAt, istHhmm, formatSlotTime, WEEKDAYS } from '@/lib/recurrence';

/**
 * Recurring setup (CD-041): weekdays + one start time for the services in the cart, the per-visit
 * price from the server quote, and whether ChoreDash Money covers the first visit (it pays for every
 * visit — no Pass, no card). Saving only stores the plan in the cart; the cart starts it.
 */
export function RecurringScreen() {
  const { t } = useTranslation('recurring');
  const hubId = useLocationStore((s) => s.location?.hubId ?? null);
  const totalMinutes = useCartDraftStore(selectTotalMinutes);
  const saved = useCartDraftStore((s) => s.recurrence);
  const setRecurrence = useCartDraftStore((s) => s.setRecurrence);
  const isUser = useSessionStore((s) => s.status === 'authenticated');

  const [days, setDays] = useState<number[]>(saved?.daysOfWeek ?? []);
  const [time, setTime] = useState<string | null>(saved?.slotTime ?? null);

  // Start times = tomorrow's slot grid for this area (service hours, 30-min steps).
  const tomorrow = useMemo(() => istDateKey(new Date(), 1), []);
  const slots = useSlots(hubId, tomorrow, Math.max(totalMinutes, 30));
  const times = useMemo(
    () => [...new Set((slots.data?.slots ?? []).map((s) => istHhmm(s.start)))],
    [slots.data],
  );

  const { quote } = useCartQuote();
  const wallet = useWalletSummary();
  const perVisit = quote?.totalPaise;
  const balance = wallet.data?.totalPaise;
  const shortBy = isUser && perVisit !== undefined && balance !== undefined ? perVisit - balance : 0;

  const complete = days.length > 0 && time !== null;
  const first = complete ? firstVisitAt(days, time) : null;

  const toggleDay = (d: number) =>
    setDays((cur) => (cur.includes(d) ? cur.filter((x) => x !== d) : [...cur, d]));
  const save = () => {
    if (!complete) return;
    setRecurrence({ daysOfWeek: [...days].sort((a, b) => a - b), slotTime: time });
    if (router.canGoBack()) router.back();
    else router.replace('/cart');
  };

  return (
    <Screen
      edges={[]}
      testID="Recurring"
      footer={
        <StickyFooter>
          <Button title={t('save')} size="lg" fullWidth disabled={!complete} onPress={save} />
        </StickyFooter>
      }>
      <Text tone="muted">{t('subtitle')}</Text>

      <View className="gap-2">
        <View className="gap-0.5">
          <Text variant="h3">{t('daysTitle')}</Text>
          <Text variant="caption" tone="muted">
            {t('daysHint')}
          </Text>
        </View>
        <View className="flex-row gap-1.5">
          {WEEKDAYS.map((d) => (
            <Chip
              key={d.value}
              fill
              label={d.short}
              selected={days.includes(d.value)}
              onPress={() => toggleDay(d.value)}
            />
          ))}
        </View>
      </View>

      <View className="gap-2">
        <View className="gap-0.5">
          <Text variant="h3">{t('timeTitle')}</Text>
          <Text variant="caption" tone="muted">
            {t('timeHint')}
          </Text>
        </View>
        {slots.isPending ? (
          <Skeleton height={96} rounded="card" />
        ) : times.length === 0 ? (
          <Text tone="muted">{t('noTimes')}</Text>
        ) : (
          <View className="flex-row flex-wrap gap-2">
            {times.map((hhmm) => (
              <Chip
                key={hhmm}
                label={formatSlotTime(hhmm)}
                selected={time === hhmm}
                onPress={() => setTime(hhmm)}
              />
            ))}
          </View>
        )}
      </View>

      {complete && (
        <Card className="gap-1">
          <Text weight="semibold">{describePlan(days, time)}</Text>
          {first && (
            <Text variant="caption" tone="muted">
              {t('firstVisit', { date: formatDay(first) })}
            </Text>
          )}
          {perVisit !== undefined && (
            <Text variant="caption" tone="muted">
              {t('perVisit', { amount: formatMoney(perVisit) })} · {t('payFrom')}
              {balance !== undefined ? ` · ${t('balance', { amount: formatMoney(balance) })}` : ''}
            </Text>
          )}
        </Card>
      )}

      {shortBy > 0 && (
        <Banner
          tone="warning"
          title={t('shortTitle', { amount: formatMoney(shortBy) })}
          message={t('shortMessage')}
          action={
            <Button
              size="sm"
              variant="secondary"
              title={t('addMoney')}
              onPress={() => router.push('/wallet')}
            />
          }
        />
      )}

      <Text variant="caption" tone="muted">
        {t('rules')}
      </Text>
    </Screen>
  );
}
