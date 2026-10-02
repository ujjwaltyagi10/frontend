import { openBrowserAsync, WebBrowserPresentationStyle } from 'expo-web-browser';
import { useEffect, useRef, useState, type ReactNode, type RefObject } from 'react';
import { Keyboard, Platform, Pressable, ScrollView, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { useAppConfig } from '@/api';
import { Text } from '@/components/ui';
import { useTranslation } from '@/lib/i18n';

import { ServiceCollage } from './service-collage';

const openPage = (url: string) =>
  void openBrowserAsync(url, { presentationStyle: WebBrowserPresentationStyle.AUTOMATIC });

type Props = {
  /** The pill in the header's top-right corner ("Skip login" / "Not now"). */
  corner: { label: string; onPress: () => void; disabled?: boolean };
  /** Hide the collage on later steps (OTP) so the form sits higher. */
  collage?: boolean;
  /** The Terms/Privacy line; only needed where the user agrees (the phone step). */
  legal?: boolean;
  testID?: string;
  children: ReactNode;
};

/** A7 shell shared by the first-run login and the guest login modal: brand header, collage, legal links. */
export function LoginLayout({ corner, collage = true, legal = true, testID, children }: Props) {
  const { t } = useTranslation('onboarding');
  const insets = useSafeAreaInsets();
  const links = useAppConfig().data?.links;
  const scrollRef = useRef<ScrollView>(null);
  const keyboardHeight = useKeyboardLift(scrollRef);

  return (
    <View className="flex-1 bg-page" testID={testID}>
      <ScrollView
        ref={scrollRef}
        keyboardShouldPersistTaps="handled"
        contentContainerStyle={{ paddingBottom: (keyboardHeight || insets.bottom) + 16 }}>
        <View className="rounded-b-hero bg-primary px-4 pb-8" style={{ paddingTop: insets.top + 12 }}>
          <Pressable
            accessibilityRole="button"
            onPress={corner.onPress}
            disabled={corner.disabled}
            className="self-end rounded-pill bg-primary-deep px-3 py-1.5 active:opacity-70">
            <Text variant="caption" weight="semibold" tone="onPrimary">
              {corner.label}
            </Text>
          </Pressable>
          <View className="items-center gap-1 pt-2">
            <Text variant="display" tone="onPrimary">
              ChoreDash
            </Text>
            <Text variant="h3" weight="medium" tone="onPrimary" className="text-center">
              {t('login.tagline')}
            </Text>
          </View>
        </View>

        {collage && (
          <View className="pt-4">
            <ServiceCollage />
          </View>
        )}

        <View className="gap-4 px-4 pt-4">
          {children}
          {legal && (
            <Text variant="caption" tone="muted" className="text-center">
              {t('login.legalPrefix')}
              {'\n'}
              <Text
                variant="caption"
                weight="semibold"
                className="underline"
                onPress={links ? () => openPage(links.terms) : undefined}>
                {t('login.terms')}
              </Text>{' '}
              &amp;{' '}
              <Text
                variant="caption"
                weight="semibold"
                className="underline"
                onPress={links ? () => openPage(links.privacy) : undefined}>
                {t('login.privacy')}
              </Text>
            </Text>
          )}
        </View>
      </ScrollView>
    </View>
  );
}

/**
 * Keeps the form above the keyboard on both platforms: room for the keyboard under the content,
 * then scroll to the end so "Log in or Sign up", the field and Continue sit just above it.
 * (KeyboardAvoidingView did nothing on Android's edge-to-edge window and too little on iOS.)
 */
function useKeyboardLift(scrollRef: RefObject<ScrollView | null>) {
  const [height, setHeight] = useState(0);
  useEffect(() => {
    const ios = Platform.OS === 'ios';
    const show = Keyboard.addListener(ios ? 'keyboardWillShow' : 'keyboardDidShow', (e) => {
      setHeight(e.endCoordinates.height);
      // After the padding lands, so there is room to scroll into.
      setTimeout(() => scrollRef.current?.scrollToEnd({ animated: true }), ios ? 50 : 100);
    });
    const hide = Keyboard.addListener(ios ? 'keyboardWillHide' : 'keyboardDidHide', () => setHeight(0));
    return () => {
      show.remove();
      hide.remove();
    };
  }, [scrollRef]);
  return height;
}
