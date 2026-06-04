import { router, useLocalSearchParams } from 'expo-router';
import { Text, View } from 'react-native';
import { KariButton, Screen, SuccessBadge } from '@kari/mobile-core';

/** Generic success interstitial (top-level so it's reachable while authenticated).
 *  `next` selects the destination on Continue. */
export default function Success() {
  const { title, subtitle, next, cta } = useLocalSearchParams<{
    title?: string;
    subtitle?: string;
    next?: string;
    cta?: string;
  }>();

  const go = () => {
    if (next === 'onboarding') router.replace('/(onboarding)');
    else router.replace('/(tabs)/home');
  };

  return (
    <Screen className="px-6">
      <View className="flex-1 items-center justify-center">
        <SuccessBadge />
        <Text className="mt-8 text-center font-pbold text-2xl text-white">{title ?? 'Success'}</Text>
        {subtitle ? (
          <Text className="mt-2 text-center font-sans text-base text-muted">{subtitle}</Text>
        ) : null}
      </View>
      <View className="pb-10">
        <KariButton label={cta ?? 'Continue'} onPress={go} />
      </View>
    </Screen>
  );
}
