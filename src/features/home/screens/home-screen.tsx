import { Image } from 'expo-image';
import { router } from 'expo-router';
import { Pressable, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { illustrations } from '@/components/illustrations';
import {
  Banner,
  Icon,
  IconButton,
  icons,
  RefreshScrollView,
  Skeleton,
  StateView,
  Text,
} from '@/components/ui';
import { useTranslation } from '@/lib/i18n';
import { useCartDraftStore, useLocationStore, useSessionStore } from '@/stores';

import { ComingSoonCard } from '../components/coming-soon-card';
import { HeroAction } from '../components/hero-action';
import { ServiceTile, ServiceTileSkeleton } from '../components/service-tile';
import { useHome } from '../hooks/use-home';

/** B1–B4 Home; B5 skeleton on first load; B6 not-served state. */
export function HomeScreen() {
  const { t } = useTranslation('home');
  const location = useLocationStore((s) => s.location);
  const isGuest = useSessionStore((s) => s.status === 'guest');
  const home = useHome();
  const setMode = useCartDraftStore((s) => s.setMode);

  return (
    <SafeAreaView edges={['top']} className="flex-1 bg-page" testID="B1">
      {/* AddressHeader: tap the address to change it (A6). Guests get no wallet icon (A10). */}
      <View className="flex-row items-center gap-1 px-4 py-1">
        <Pressable
          accessibilityRole="button"
          accessibilityLabel={`Delivery location ${location?.label ?? ''}. Change`}
          onPress={() => router.push('/change-location')}
          className="flex-1 py-1 active:opacity-60">
          <View className="flex-row items-center gap-1">
            <Icon name={icons.location} size={14} />
            <Text variant="h3" numberOfLines={1}>
              {location?.label ?? '—'}
            </Text>
            <Icon name={icons.chevronDown} size={12} />
          </View>
          <Text variant="caption" tone="muted" numberOfLines={1}>
            {location?.line}
          </Text>
        </Pressable>
        {!isGuest && (
          <Pressable
            accessibilityRole="button"
            accessibilityLabel="ChoreDash Money"
            onPress={() => router.push('/wallet')}
            className="h-10 w-10 items-center justify-center rounded-pill bg-muted active:opacity-70">
            <Image source={illustrations.wallet} style={{ width: 28, height: 28 }} accessible={false} />
          </Pressable>
        )}
        <IconButton
          variant="filled"
          icon={icons.profile}
          accessibilityLabel="Profile"
          onPress={() => router.push('/profile')}
        />
      </View>

      {home.isPending ? (
        <HomeSkeleton />
      ) : home.isError ? (
        <StateView state="error" error={home.error} onRetry={() => home.refetch()} />
      ) : (
        <RefreshScrollView contentContainerClassName="gap-5 p-4 pb-8" onRefresh={home.refetch}>
          {!location?.serviceable && <ComingSoonCard />}
          <View className="flex-row items-end">
            <Text variant="h2" className="flex-1 pb-3">
              {home.data.headline}
            </Text>
            <Image
              source={illustrations.heroPro}
              style={{ width: 112, height: 150, marginBottom: -20 }}
              accessible={false}
            />
          </View>
          <View className="flex-row gap-3">
            <HeroAction
              title={t('instant')}
              subtitle="In 30 minutes"
              art={illustrations.instant}
              onPress={() => {
                setMode('instant');
                router.push('/cart');
              }}
            />
            <HeroAction
              title={t('schedule')}
              subtitle={t('pickSlot')}
              art={illustrations.schedule}
              onPress={() => router.push('/schedule')}
            />
          </View>
          {home.data.passBanner && (
            <Banner
              tone="offer"
              title={home.data.passBanner.title}
              message={home.data.passBanner.subtitle}
              onPress={() => router.push('/pass')}
              art={illustrations.passTickets}
            />
          )}
          <View className="gap-0.5">
            <Text variant="h2">{t('allServices')}</Text>
            <Text variant="caption" tone="muted">
              {t('allServicesSub')}
            </Text>
          </View>
          <View className="flex-row flex-wrap justify-between gap-y-5">
            {home.data.services.map((s) => (
              <ServiceTile key={s.slug} service={s} />
            ))}
          </View>
          <Text variant="caption" tone="muted" className="text-center">
            {t('trust', { families: home.data.trust.familiesServed, rating: home.data.trust.avgRating })}
          </Text>
        </RefreshScrollView>
      )}
    </SafeAreaView>
  );
}

function HomeSkeleton() {
  return (
    <View className="gap-5 p-4" testID="B5" accessibilityLabel="Loading" accessibilityRole="progressbar">
      <Skeleton width="70%" height={28} />
      <View className="flex-row gap-3">
        <View className="flex-1">
          <Skeleton height={72} rounded="card" />
        </View>
        <View className="flex-1">
          <Skeleton height={72} rounded="card" />
        </View>
      </View>
      <Skeleton height={64} rounded="card" />
      <View className="flex-row flex-wrap justify-between gap-y-5">
        {Array.from({ length: 6 }, (_, i) => (
          <ServiceTileSkeleton key={i} />
        ))}
      </View>
    </View>
  );
}
