import { type ReactNode } from 'react';
import { ImageBackground, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { colors } from '@/theme/tokens';

/**
 * Rider auth/onboarding screen wrapper. Renders the Figma "Customer Onboarding"
 * blob backdrop (transparent olive blobs over #070707) behind a safe-area content
 * area. Uses ImageBackground so the artwork reliably paints under the content.
 * Mirrors <Screen>'s API (children + className for padding/layout).
 */
export function OnboardingScreen({
  children,
  className,
}: {
  children: ReactNode;
  className?: string;
}) {
  return (
    <ImageBackground
      source={require('../../assets/onboarding/onboarding-blobs.png')}
      resizeMode="cover"
      style={{ flex: 1, backgroundColor: colors.bg }}
    >
      <SafeAreaView style={{ flex: 1 }}>
        <View className={`flex-1 ${className ?? ''}`}>{children}</View>
      </SafeAreaView>
    </ImageBackground>
  );
}
