import * as Linking from 'expo-linking';
import { router, Stack, useLocalSearchParams } from 'expo-router';
import { useEffect, useState } from 'react';
import { Pressable, Share, View } from 'react-native';

import type { ServiceDetail } from '@/api';
import { ServiceArt } from '@/components/service-art';
import {
  Accordion,
  Badge,
  Banner,
  Button,
  Card,
  Icon,
  IconButton,
  icons,
  PriceText,
  Screen,
  Skeleton,
  SkeletonText,
  StateView,
  Steps,
  StickyFooter,
  Text,
} from '@/components/ui';
import { track } from '@/lib/analytics';
import { formatDuration, formatMoney, savingsPercent } from '@/lib/format';
import { useTranslation } from '@/lib/i18n';
import { useCartDraftStore, useLocationStore } from '@/stores';
import { colors } from '@/theme';

import { useService } from '../hooks/use-service';

/** C1–C7 service page (CD-031): hero, duration cards, includes, how it's done, FAQs, sticky BOOK. */
export function ServiceDetailScreen() {
  const { slug } = useLocalSearchParams<{ slug: string }>();
  const service = useService(slug);

  useEffect(() => track('service_viewed', { service_slug: slug }), [slug]);

  if (service.isPending)
    return (
      <Screen edges={[]}>
        <Skeleton aspectRatio={16 / 9} rounded="hero" />
        <SkeletonText lines={6} />
      </Screen>
    );
  if (service.isError) return <StateView state="error" error={service.error} onRetry={service.refetch} />;
  return <Detail service={service.data} />;
}

function Detail({ service: s }: { service: ServiceDetail }) {
  const { t } = useTranslation();
  const addItem = useCartDraftStore((st) => st.addItem);
  const serviceable = useLocationStore((st) => st.location?.serviceable ?? false);
  const [duration, setDuration] = useState(s.durations[0]?.durationMin ?? s.defaultDurationMin);
  const selected = s.durations.find((d) => d.durationMin === duration) ?? s.durations[0];

  const book = () => {
    addItem(s.slug, duration);
    track('cart_item_added', { service_slug: s.slug, duration_min: duration, source: 'detail' });
    router.push('/cart');
  };

  // C1: OS share sheet with a deep link to this page.
  const share = () =>
    void Share.share({
      message: `${s.name} on ChoreDash — ${formatMoney(s.pricePaise)} onwards. ${Linking.createURL(`/service/${s.slug}`)}`,
    });

  return (
    <Screen
      edges={[]}
      testID="C1"
      footer={
        <StickyFooter
          summary={
            selected && (
              <View>
                <PriceText price={selected.pricePaise} mrp={selected.mrpPaise} />
                <Text variant="micro" tone="muted">
                  {formatDuration(selected.durationMin)}
                </Text>
              </View>
            )
          }>
          <Button
            title={serviceable ? t('actions.book') : 'Not in your area yet'}
            size="lg"
            fullWidth
            disabled={!serviceable}
            onPress={book}
          />
        </StickyFooter>
      }>
      <Stack.Screen
        options={{
          title: '',
          headerRight: () => (
            <IconButton icon={icons.share} accessibilityLabel={`Share ${s.name}`} onPress={share} />
          ),
        }}
      />

      <ServiceArt slug={s.slug} imageUrl={s.imageUrl} aspectRatio={16 / 9} rounded="hero" />

      <View className="gap-1.5">
        <View className="flex-row items-center gap-2">
          {s.isNew && <Badge label="NEW" />}
          <View className="flex-row items-center gap-1 rounded-pill bg-card px-2 py-0.5">
            <Icon name={icons.star} size={11} />
            <Text variant="caption" weight="semibold">
              {s.rating.toFixed(1)}
            </Text>
            <Text variant="caption" tone="muted">
              ({s.ratingCount.toLocaleString('en-IN')} ratings)
            </Text>
          </View>
        </View>
        <Text variant="h1">{s.name}</Text>
        <Text tone="muted">{s.tagline}</Text>
      </View>

      {!serviceable && (
        <Banner
          tone="warning"
          title="Not available in your area yet"
          message="Change your location to book."
        />
      )}

      {s.durations.length > 0 && (
        <View className="gap-2">
          <Text variant="h3">Choose duration</Text>
          <View className="flex-row flex-wrap gap-2">
            {s.durations.map((d) => {
              const on = d.durationMin === duration;
              const save = savingsPercent(d.pricePaise, d.mrpPaise);
              return (
                <Pressable
                  key={d.durationMin}
                  accessibilityRole="radio"
                  accessibilityState={{ checked: on }}
                  accessibilityLabel={`${formatDuration(d.durationMin)}, ${formatMoney(d.pricePaise)}`}
                  onPress={() => setDuration(d.durationMin)}
                  className={`min-w-[30%] flex-1 gap-1 rounded-card border-2 p-3 active:opacity-80 ${
                    on ? 'border-primary-strong bg-tint' : 'border-line bg-card'
                  }`}>
                  <Text weight="semibold">{formatDuration(d.durationMin)}</Text>
                  <PriceText price={d.pricePaise} mrp={d.mrpPaise} size="sm" />
                  {save > 0 && (
                    <Text variant="micro" tone="success" weight="semibold">
                      {save}% off
                    </Text>
                  )}
                </Pressable>
              );
            })}
          </View>
        </View>
      )}

      <Card className="gap-3">
        <Text variant="h3">What&apos;s included</Text>
        {s.includes.map((i) => (
          <View key={i} className="flex-row items-center gap-3">
            <Icon name={icons.check} size={14} color={colors.success} />
            <Text className="flex-1">{i}</Text>
          </View>
        ))}
        {s.excludes.length > 0 && (
          <View className="gap-3 border-t border-line pt-3">
            <Text weight="semibold" tone="muted">
              Not included
            </Text>
            {s.excludes.map((i) => (
              <View key={i} className="flex-row items-center gap-3">
                <Icon name={icons.close} size={14} color={colors.danger} />
                <Text tone="muted" className="flex-1">
                  {i}
                </Text>
              </View>
            ))}
          </View>
        )}
      </Card>

      {s.steps.length > 0 && (
        <View className="gap-3">
          <Text variant="h3">How it&apos;s done</Text>
          <Steps steps={s.steps} />
        </View>
      )}

      {s.faqs.length > 0 && (
        <View className="gap-1">
          <Text variant="h3">FAQs</Text>
          <Accordion items={s.faqs} />
        </View>
      )}
    </Screen>
  );
}
