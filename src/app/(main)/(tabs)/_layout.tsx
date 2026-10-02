import { Tabs } from 'expo-router';
import { SymbolView, type SymbolViewProps } from 'expo-symbols';
import type { ColorValue } from 'react-native';

import { PillTabBar } from '@/components/navigation/pill-tab-bar';
import { CartBar } from '@/features/cart';
import { useTranslation } from '@/lib/i18n';
import { useSessionStore } from '@/stores';
import { colors } from '@/theme';

type IconName = SymbolViewProps['name'];

/** Filled glyph when selected, outline otherwise (as in the reference tab bar). */
const icon = (filled: IconName, outline: IconName) =>
  function TabIcon({ focused, color }: { focused: boolean; color: ColorValue }) {
    return <SymbolView name={focused ? filled : outline} tintColor={color} size={20} />;
  };

/** Bottom tabs: Home · Bookings · Money. Guests don't get the Money tab (A10). */
export default function TabsLayout() {
  const { t } = useTranslation();
  const isGuest = useSessionStore((s) => s.status === 'guest');

  return (
    <Tabs
      tabBar={(props) => (
        <>
          {/* Mini cart floats above the tabs on Home (B7), like the reference app. */}
          {props.state.routes[props.state.index]?.name === 'index' && <CartBar />}
          <PillTabBar {...props} />
        </>
      )}
      screenOptions={{ headerShown: false, sceneStyle: { backgroundColor: colors.surface.page } }}>
      <Tabs.Screen
        name="index"
        options={{
          title: t('tabs.home'),
          tabBarIcon: icon(
            { ios: 'house.fill', android: 'home', web: 'home' },
            { ios: 'house', android: 'home', web: 'home' },
          ),
        }}
      />
      <Tabs.Screen
        name="bookings"
        options={{
          title: t('tabs.bookings'),
          tabBarIcon: icon(
            { ios: 'list.clipboard.fill', android: 'assignment', web: 'assignment' },
            { ios: 'list.clipboard', android: 'assignment', web: 'assignment' },
          ),
        }}
      />
      <Tabs.Protected guard={!isGuest}>
        <Tabs.Screen
          name="wallet"
          options={{
            title: t('tabs.money'),
            tabBarIcon: icon(
              { ios: 'wallet.bifold.fill', android: 'account_balance_wallet', web: 'account_balance_wallet' },
              { ios: 'wallet.bifold', android: 'account_balance_wallet', web: 'account_balance_wallet' },
            ),
          }}
        />
      </Tabs.Protected>
    </Tabs>
  );
}
