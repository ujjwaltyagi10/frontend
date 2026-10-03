import * as Clipboard from 'expo-clipboard';
import { router } from 'expo-router';
import { useEffect, useState } from 'react';
import { Pressable, Share, View } from 'react-native';

import type { ReferralSummary, ReferralTier } from '@/api';
import {
  Badge,
  Button,
  EmptyState,
  Icon,
  Screen,
  Skeleton,
  SkeletonText,
  StateView,
  Steps,
  StickyFooter,
  Text,
} from '@/components/ui';
import { track } from '@/lib/analytics';
import { formatMoney } from '@/lib/format';
import { useTranslation } from '@/lib/i18n';
import { useSessionStore } from '@/stores';
import { colors } from '@/theme';

import { useReferral } from '../hooks/use-referral';

/** H5–H6 Refer & earn (CD-066): code to copy/share, earnings, tiers, how it works. */
export function ReferralScreen() {
  const isGuest = useSessionStore((s) => s.status === 'guest');
  const referral = useReferral();

  if (isGuest)
    return (
      <EmptyState
        title="Log in to refer friends"
        message="Your referral code is linked to your account."
        actionTitle="Log in"
        onAction={() => router.push('/login-modal')}
      />
    );
  if (referral.isPending)
    return (
      <Screen edges={[]}>
        <Skeleton height={180} rounded="hero" />
        <SkeletonText lines={6} />
      </Screen>
    );
  if (referral.isError) return <StateView state="error" error={referral.error} onRetry={referral.refetch} />;
  return <Referral r={referral.data} />;
}

function Referral({ r }: { r: ReferralSummary }) {
  const { t } = useTranslation('referral');
  const [copied, setCopied] = useState(false);
  const friend = formatMoney(r.friendDiscountPaise);
  const max = formatMoney(Math.max(...r.tiers.map((x) => x.rewardPaise)));

  useEffect(() => {
    if (!copied) return;
    const id = setTimeout(() => setCopied(false), 2000);
    return () => clearTimeout(id);
  }, [copied]);

  const copy = async () => {
    await Clipboard.setStringAsync(r.code);
    setCopied(true);
    track('referral_shared', { channel: 'copy' });
  };
  const share = async () => {
    const res = await Share.share({ message: t('shareMessage', { friend, code: r.code, url: r.shareUrl }) });
    if (res.action === Share.sharedAction)
      track('referral_shared', { channel: res.activityType ?? 'share_sheet' });
  };

  return (
    <Screen
      edges={[]}
      testID="H5"
      footer={
        <StickyFooter>
          <Button title={t('share')} size="lg" fullWidth onPress={share} />
        </StickyFooter>
      }>
      <View className="items-center gap-2 rounded-hero bg-primary-deep px-5 py-6">
        <View className="h-14 w-14 items-center justify-center rounded-pill bg-card">
          <Icon
            name={{ ios: 'gift.fill', android: 'redeem', web: 'redeem' }}
            size={26}
            color={colors.brand.primaryDeep}
          />
        </View>
        <Text variant="h2" tone="onPrimary" className="text-center">
          {t('heroTitle', { friend, max })}
        </Text>
        <Text variant="caption" tone="onPrimaryMuted" className="text-center">
          {t('heroSubtitle', { friend })}
        </Text>
      </View>

      <View className="gap-2">
        <Text variant="caption" tone="muted">
          {t('codeLabel')}
        </Text>
        <Pressable
          accessibilityRole="button"
          accessibilityLabel={`${t('codeLabel')} ${r.code}. ${copied ? t('copied') : t('copy')}`}
          onPress={copy}
          className="flex-row items-center justify-between rounded-card border border-dashed border-line-strong bg-card px-4 py-3 active:opacity-70">
          <Text variant="h2" className="tracking-widest">
            {r.code}
          </Text>
          <View className="rounded-pill bg-tint px-3 py-1.5">
            <Text variant="caption" weight="semibold" tone="accent">
              {copied ? t('copied') : t('copy')}
            </Text>
          </View>
        </Pressable>
      </View>

      <View className="flex-row rounded-card border border-line bg-card py-3">
        <Stat label={t('statsCompleted')} value={String(r.completedCount)} />
        <View className="w-px bg-line" />
        <Stat label={t('statsPending')} value={String(r.pendingCount)} />
        <View className="w-px bg-line" />
        <Stat label={t('statsEarned')} value={formatMoney(r.earnedPaise)} />
      </View>

      <View className="gap-2">
        <Text variant="h3">{t('tiersTitle')}</Text>
        <View className="rounded-card border border-line bg-card">
          {r.tiers.map((tier, i) => (
            <TierRow key={tier.id} tier={tier} current={tier.id === r.currentTierId} first={i === 0} />
          ))}
        </View>
      </View>

      <View className="gap-3">
        <Text variant="h3">{t('howTitle')}</Text>
        <Steps
          steps={[
            { title: t('step1'), body: t('step1Body', { friend }) },
            { title: t('step2'), body: t('step2Body') },
            { title: t('step3'), body: t('step3Body') },
          ]}
        />
      </View>

      <Text variant="caption" tone="muted">
        {t('terms')}
      </Text>
    </Screen>
  );
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <View className="flex-1 items-center gap-0.5">
      <Text weight="semibold">{value}</Text>
      <Text variant="micro" tone="muted" className="uppercase">
        {label}
      </Text>
    </View>
  );
}

function TierRow({ tier, current, first }: { tier: ReferralTier; current: boolean; first: boolean }) {
  const { t } = useTranslation('referral');
  const range =
    tier.maxReferrals === null
      ? t('tierRangeOpen', { min: tier.minReferrals })
      : t('tierRange', { min: tier.minReferrals, max: tier.maxReferrals });
  return (
    <View
      className={`flex-row items-center gap-3 px-4 py-3 ${first ? '' : 'border-t border-line'} ${current ? 'bg-tint' : ''}`}>
      <View className="flex-1 gap-0.5">
        <View className="flex-row items-center gap-2">
          <Text weight="semibold">{tier.name}</Text>
          {current && <Badge label={t('current')} tone="solid" />}
        </View>
        <Text variant="caption" tone="muted">
          {range}
        </Text>
      </View>
      <Text weight="semibold" tone={current ? 'accent' : 'default'}>
        {t('tierReward', { amount: formatMoney(tier.rewardPaise) })}
      </Text>
    </View>
  );
}
