import { router } from 'expo-router';
import { openBrowserAsync, WebBrowserPresentationStyle } from 'expo-web-browser';
import { View } from 'react-native';

import { useAppConfig } from '@/api';
import { Accordion, Icon, ListGroup, ListRow, Screen, Text } from '@/components/ui';
import { useTranslation } from '@/lib/i18n';
import { colors } from '@/theme';

const FAQS = ['how', 'included', 'price', 'pass', 'money', 'cancel', 'failed'] as const;

/** G3–G4 Help & support (CD-063): contact options and FAQs. In-app chat lands with the support backend. */
export function SupportScreen() {
  const { t } = useTranslation('support');
  const supportUrl = useAppConfig().data?.links.support;

  return (
    <Screen edges={[]} testID="G3">
      <View className="flex-row items-center gap-4 rounded-hero bg-primary-deep p-4">
        <View className="h-14 w-14 items-center justify-center rounded-pill bg-card">
          <Icon
            name={{ ios: 'headphones', android: 'support_agent', web: 'support_agent' }}
            size={26}
            color={colors.brand.primaryDeep}
          />
        </View>
        <View className="flex-1 gap-0.5">
          <Text variant="h2" tone="onPrimary">
            {t('heroTitle')}
          </Text>
          <Text variant="caption" tone="onPrimaryMuted">
            {t('heroSubtitle')}
          </Text>
        </View>
      </View>

      <ListGroup title={t('getHelp')}>
        {supportUrl && (
          <ListRow
            title={t('chat')}
            subtitle={t('chatSub')}
            icon={{ ios: 'message', android: 'chat', web: 'chat' }}
            onPress={() =>
              void openBrowserAsync(supportUrl, { presentationStyle: WebBrowserPresentationStyle.AUTOMATIC })
            }
          />
        )}
        <ListRow
          title={t('booking')}
          subtitle={t('bookingSub')}
          icon={{ ios: 'calendar', android: 'calendar_month', web: 'calendar_month' }}
          onPress={() => router.push('/profile/bookings')}
        />
      </ListGroup>

      <View className="gap-2">
        <Text variant="h3">{t('faqsTitle')}</Text>
        <View className="rounded-card border border-line bg-card px-4">
          <Accordion items={FAQS.map((k) => ({ question: t(`faqs.${k}.q`), answer: t(`faqs.${k}.a`) }))} />
        </View>
      </View>
    </Screen>
  );
}
