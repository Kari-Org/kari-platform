import { Ionicons } from '@expo/vector-icons';
import type { BottomTabBarProps } from '@react-navigation/bottom-tabs';
import { Pressable, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { colors } from '@/theme/tokens';

const ICONS: Record<string, keyof typeof Ionicons.glyphMap> = {
  home: 'home',
  rides: 'car',
  account: 'person',
};

/** Dark rounded tab bar with a yellow active icon (Flutter parity). */
export function DotTabBar({ state, navigation }: BottomTabBarProps) {
  const insets = useSafeAreaInsets();
  return (
    <View style={{ paddingBottom: insets.bottom }} className="bg-surface">
      <View className="flex-row justify-around rounded-t-[28px] bg-card py-3">
        {state.routes.map((route, i) => {
          const focused = state.index === i;
          return (
            <Pressable
              key={route.key}
              onPress={() => navigation.navigate(route.name)}
              className="items-center px-6 py-1"
            >
              <Ionicons
                name={ICONS[route.name] ?? 'ellipse'}
                size={24}
                color={focused ? colors.brand : colors.subtle}
              />
            </Pressable>
          );
        })}
      </View>
    </View>
  );
}
