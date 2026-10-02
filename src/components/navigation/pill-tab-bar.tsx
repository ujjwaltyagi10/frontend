import type { Tabs } from 'expo-router';
import type { ComponentProps } from 'react';
import { Pressable, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { Text } from '@/components/ui';
import { colors } from '@/theme';

export type TabBarProps = Parameters<NonNullable<ComponentProps<typeof Tabs>['tabBar']>>[0];

/**
 * Bottom tab bar modelled on the reference app (Screen Flow B1): white bar with a hairline on
 * top; each tab is icon + label side by side; the selected tab sits in a soft cyan pill with a
 * filled icon, the others are an outline icon and a grey label.
 * Sizes from the reference (iQOO Z6, ≈393 dp wide): pill ≈ 41 dp tall, 12 dp corners, 15 sp label.
 */
export function PillTabBar({ state, descriptors, navigation }: TabBarProps) {
  const insets = useSafeAreaInsets();
  return (
    <View
      accessibilityRole="tablist"
      className="flex-row gap-2 border-t border-line bg-card px-3 pt-2"
      style={{ paddingBottom: Math.max(insets.bottom, 10) }}>
      {state.routes.map((route, index) => {
        const { options } = descriptors[route.key];
        const focused = state.index === index;
        const label = typeof options.title === 'string' ? options.title : route.name;
        const tint = focused ? colors.brand.primaryStrong : colors.text.secondary;

        const onPress = () => {
          const event = navigation.emit({ type: 'tabPress', target: route.key, canPreventDefault: true });
          if (!focused && !event.defaultPrevented) navigation.navigate(route.name, route.params);
        };

        return (
          <Pressable
            key={route.key}
            accessibilityRole="tab"
            accessibilityState={{ selected: focused }}
            accessibilityLabel={options.tabBarAccessibilityLabel ?? label}
            testID={`tab-${route.name}`}
            onPress={onPress}
            onLongPress={() => navigation.emit({ type: 'tabLongPress', target: route.key })}
            className={`h-[41px] flex-1 flex-row items-center justify-center gap-2 rounded-card ${
              focused ? 'bg-tint' : 'active:bg-muted'
            }`}>
            {options.tabBarIcon?.({ focused, color: tint, size: 20 })}
            <Text weight={focused ? 'semibold' : 'medium'} style={{ color: tint }} numberOfLines={1}>
              {label}
            </Text>
          </Pressable>
        );
      })}
    </View>
  );
}
