import { Ionicons } from '@expo/vector-icons';
import type { BottomTabBarProps } from '@react-navigation/bottom-tabs';
import { Pressable, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { colors } from '@/theme/tokens';

const TABS: Record<
  string,
  { label: string; on: keyof typeof Ionicons.glyphMap; off: keyof typeof Ionicons.glyphMap }
> = {
  home: { label: 'Home', on: 'home', off: 'home-outline' },
  rides: { label: 'Rides', on: 'car', off: 'car-outline' },
  account: { label: 'Account', on: 'person', off: 'person-outline' },
};

/** Floating dark pill tab bar with icon + label (Figma parity). */
export function DotTabBar({ state, navigation }: BottomTabBarProps) {
  const insets = useSafeAreaInsets();
  return (
    <View
      style={{ paddingBottom: insets.bottom || 12 }}
      className="rounded-t-[40px] bg-surface px-6 pt-3"
    >
      <View className="flex-row justify-around rounded-full bg-card py-2.5">
        {state.routes.map((route, i) => {
          const focused = state.index === i;
          const tab = TABS[route.name];
          if (!tab) return null;
          return (
            <Pressable
              key={route.key}
              onPress={() => navigation.navigate(route.name)}
              className="items-center px-4 py-1"
            >
              <Ionicons
                name={focused ? tab.on : tab.off}
                size={24}
                color={focused ? colors.brand : colors.subtle}
              />
              <Text
                className={`mt-0.5 font-sans text-xs ${focused ? 'text-brand' : 'text-subtle'}`}
              >
                {tab.label}
              </Text>
            </Pressable>
          );
        })}
      </View>
    </View>
  );
}
