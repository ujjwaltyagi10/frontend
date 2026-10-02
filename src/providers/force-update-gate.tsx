import Constants from 'expo-constants';
import type { ReactNode } from 'react';
import { Linking, Platform, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { useAppConfig } from '@/api';
import { Button, Icon, icons, Text } from '@/components/ui';
import { isBelowMinimum } from '@/lib/version';

/**
 * A1 force update (CD-017): once GET /config says this build is below minAppVersion, nothing else
 * renders. While config is loading (or the network is down) the app starts normally from cache —
 * startup never waits on this request.
 */
export function ForceUpdateGate({ children }: { children: ReactNode }) {
  const config = useAppConfig();
  const appVersion = Constants.expoConfig?.version ?? '0.0.0';
  if (!config.data || !isBelowMinimum(appVersion, config.data.minAppVersion)) return children;

  const storeUrl = Platform.OS === 'ios' ? config.data.links.appStore : config.data.links.playStore;
  const storeName = Platform.OS === 'ios' ? 'App Store' : 'Play Store';
  return (
    <SafeAreaView className="flex-1 bg-page" testID="force-update">
      <View className="flex-1 justify-center gap-4 p-6">
        <View className="h-16 w-16 items-center justify-center rounded-pill bg-muted">
          <Icon name={icons.warning} size={28} />
        </View>
        <Text variant="h1">Update ChoreDash</Text>
        <Text tone="muted">
          This version ({appVersion}) is no longer supported. Update to keep booking — your account, bookings
          and wallet stay as they are.
        </Text>
        {storeUrl ? (
          <Button
            title={`Open the ${storeName}`}
            size="lg"
            fullWidth
            onPress={() => void Linking.openURL(storeUrl)}
          />
        ) : (
          <Text weight="semibold">Open the {storeName} and update ChoreDash.</Text>
        )}
      </View>
    </SafeAreaView>
  );
}
