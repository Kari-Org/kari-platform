import { router, useLocalSearchParams } from 'expo-router';
import { Text, View } from 'react-native';
import { KariButton } from '@/components/KariButton';
import { Screen } from '@/components/Screen';
import { SuccessBadge } from '@/components/SuccessBadge';

/**
 * Generic success interstitial (yellow check seal). Lives at the top level so
 * it's reachable while authenticated (the auth guard only bounces routes inside
 * the (auth) group). `next` selects the destination on Continue.
 */
export default function Success() {
  const { title, subtitle, next, cta } = useLocalSearchParams<{
    title?: string;
    subtitle?: string;
    next?: string;
    cta?: string;
  }>();

  const go = () => {
    if (next === 'profile') router.replace('/(onboarding)/profile');
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
