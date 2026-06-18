import { router, useLocalSearchParams } from 'expo-router';
import { Text, View } from 'react-native';
import { BrandMark } from '@/components/BrandMark';
import { KariButton } from '@/components/KariButton';
import { OnboardingScreen } from '@/components/OnboardingScreen';
import { SuccessBadge } from '@/components/SuccessBadge';

/**
 * Generic success interstitial (yellow check seal). Lives at the top level so
 * it's reachable while authenticated (the auth guard only bounces routes inside
 * the (auth) group). `next` selects the destination on Continue; `heading` is the
 * optional screen title shown under the brand mark (e.g. "Verification").
 */
export default function Success() {
  const { heading, title, subtitle, next, cta } = useLocalSearchParams<{
    heading?: string;
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
    <OnboardingScreen className="px-6">
      <View className="mb-10 mt-14 items-center">
        <BrandMark />
      </View>
      {heading ? (
        <Text className="text-center font-psemibold text-[28px] text-white">{heading}</Text>
      ) : null}
      <View className="flex-1 items-center justify-center">
        <SuccessBadge />
        <Text className="mt-8 text-center font-pmedium text-lg text-white">{title ?? 'Success'}</Text>
        {subtitle ? (
          <Text className="mt-2 text-center font-sans text-sm text-muted">{subtitle}</Text>
        ) : null}
      </View>
      <View className="pb-10">
        <KariButton label={cta ?? 'Continue'} onPress={go} />
      </View>
    </OnboardingScreen>
  );
}
