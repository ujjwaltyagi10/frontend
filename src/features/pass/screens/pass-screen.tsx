import { router } from 'expo-router';
import { useEffect } from 'react';
import { View } from 'react-native';

import type { Pass, PassOffer } from '@/api';
import {
  Accordion,
  Badge,
  Button,
  Icon,
  icons,
  ListGroup,
  Screen,
  Skeleton,
  SkeletonText,
  StateView,
  Steps,
  StickyFooter,
  Text,
  type IconName,
} from '@/components/ui';
import { track } from '@/lib/analytics';
import { formatDay, formatMoney } from '@/lib/format';
import { useSessionStore } from '@/stores';
import { colors } from '@/theme';

import { useMyPass, usePassOffer } from '../hooks/use-pass';

const BENEFIT_ICONS: IconName[] = [
  { ios: 'indianrupeesign.circle', android: 'savings', web: 'savings' },
  { ios: 'clock', android: 'schedule', web: 'schedule' },
  { ios: 'calendar', android: 'calendar_month', web: 'calendar_month' },
];

/** E1–E5 ChoreDash Pass (CD-057): offer, benefits, how it works, FAQs; active-pass state (PS-6). */
export function PassScreen() {
  const offer = usePassOffer();
  const mine = useMyPass();
  const isGuest = useSessionStore((s) => s.status === 'guest');

  useEffect(() => track('pass_viewed', {}), []);

  if (offer.isError) return <StateView state="error" error={offer.error} onRetry={offer.refetch} />;
  if (offer.isPending)
    return (
      <Screen edges={[]}>
        <Skeleton height={220} rounded="hero" />
        <SkeletonText lines={8} />
      </Screen>
    );

  const o = offer.data;
  const active = mine.data ?? null;

  const footer = active ? null : (
    <StickyFooter
      summary={
        <View>
          <Text weight="bold">{formatMoney(o.totalWithTaxPaise)}</Text>
          <Text variant="micro" tone="muted">
            incl. taxes · {o.validityDays} days
          </Text>
        </View>
      }>
      <Button
        title={isGuest ? 'Log in to buy' : 'Buy Pass'}
        size="lg"
        fullWidth
        disabled={!isGuest && mine.isPending}
        onPress={() =>
          isGuest
            ? router.push('/login-modal')
            : router.push({ pathname: '/checkout', params: { purpose: 'pass', offerId: o.id } })
        }
      />
    </StickyFooter>
  );

  return (
    <Screen edges={[]} testID="E1" footer={footer}>
      {active ? <ActivePass pass={active} /> : <OfferHero offer={o} />}

      <ListGroup title="Benefits">
        {o.benefits.map((b, i) => (
          <View key={b.title} className="flex-row items-start gap-3 px-4 py-3">
            <View className="h-9 w-9 items-center justify-center rounded-chip bg-muted">
              <Icon name={BENEFIT_ICONS[i] ?? icons.check} size={18} />
            </View>
            <View className="flex-1 gap-0.5">
              <Text weight="semibold">{b.title}</Text>
              <Text variant="caption" tone="muted">
                {b.body}
              </Text>
            </View>
          </View>
        ))}
      </ListGroup>

      <View className="gap-3">
        <Text variant="h3">How it works</Text>
        <Steps steps={o.steps} />
      </View>

      <View className="gap-2">
        <Text variant="h3">FAQs</Text>
        <View className="rounded-card border border-line bg-card px-4">
          <Accordion items={o.faqs} />
        </View>
      </View>

      <View className="flex-row items-center gap-3 rounded-card bg-muted p-4">
        <Icon name={{ ios: 'checkmark.shield', android: 'verified_user', web: 'verified_user' }} size={22} />
        <View className="flex-1">
          <Text weight="semibold">Trusted professionals</Text>
          <Text variant="caption" tone="muted">
            Background-verified, with 120+ hours of training.
          </Text>
        </View>
      </View>
    </Screen>
  );
}

/** E1 hero: what you get (3 visits), on the brand cyan, and the saving. */
function OfferHero({ offer: o }: { offer: PassOffer }) {
  const saving = o.mrpPaise !== null && o.mrpPaise > o.pricePaise ? o.mrpPaise - o.pricePaise : 0;
  return (
    <View className="gap-5 rounded-hero bg-primary p-5">
      <View className="gap-2">
        <Badge label={`VALID ${o.validityDays} DAYS`} tone="light" />
        <Text variant="h1" tone="onPrimary">
          Save on your next {o.visits} bookings
        </Text>
        <Text tone="onPrimaryMuted">
          {o.visits} visits of up to {o.minutesPerVisit} minutes each
        </Text>
      </View>

      <View className="flex-row gap-2">
        {Array.from({ length: o.visits }, (_, i) => (
          <View key={i} className="flex-1 items-center gap-1 rounded-card bg-card py-3">
            <Icon name={icons.check} size={16} color={colors.brand.primaryStrong} />
            <Text variant="micro" tone="muted">
              Visit {i + 1}
            </Text>
            <Text variant="caption" weight="semibold">
              {o.minutesPerVisit} min
            </Text>
          </View>
        ))}
      </View>

      <View className="flex-row items-end justify-between">
        <View className="flex-row items-baseline gap-2">
          <Text variant="display" tone="onPrimary">
            {formatMoney(o.pricePaise)}
          </Text>
          {o.mrpPaise !== null && saving > 0 && (
            <Text tone="onPrimary" className="line-through opacity-60">
              {formatMoney(o.mrpPaise)}
            </Text>
          )}
        </View>
        {saving > 0 && <Badge label={`SAVE ${formatMoney(saving)}`} tone="success" />}
      </View>
    </View>
  );
}

/** PS-6: once bought, the hero shows what's left instead of the offer. */
function ActivePass({ pass }: { pass: Pass }) {
  const left = pass.visitsTotal - pass.visitsUsed;
  return (
    <View className="gap-4 rounded-hero bg-primary p-5">
      <Badge label="ACTIVE" tone="success" />
      <Text variant="h1" tone="onPrimary">
        {left} of {pass.visitsTotal} visits left
      </Text>
      <View className="flex-row gap-2">
        {Array.from({ length: pass.visitsTotal }, (_, i) => (
          <View
            key={i}
            className={`h-2 flex-1 rounded-pill ${i < pass.visitsUsed ? 'bg-card/40' : 'bg-card'}`}
          />
        ))}
      </View>
      <Text tone="onPrimaryMuted">
        Up to {pass.minutesPerVisit} minutes each · valid till {formatDay(pass.expiresAt)}. Applied
        automatically when you book.
      </Text>
      <Button title="Book now" variant="secondary" onPress={() => router.navigate('/')} />
    </View>
  );
}
