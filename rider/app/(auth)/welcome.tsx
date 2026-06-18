import { router } from 'expo-router';
import { useState } from 'react';
import {
  Dimensions,
  type NativeScrollEvent,
  type NativeSyntheticEvent,
  ScrollView,
  Text,
  View,
} from 'react-native';
import { KariButton } from '@/components/KariButton';
import { OnboardingScreen } from '@/components/OnboardingScreen';

// Copy + order per Figma "Customer Onboarding" carousel (252:3311 / 3322 / 3333).
const SLIDES = [
  {
    title: 'Your Safety is Our Priority',
    body: 'Enjoy secure rides with verified drivers, OTP confirmation, and a panic button for emergencies',
  },
  {
    title: 'Rides Tailored for You',
    body: 'Choose from shuttles, carpooling, or subscriptions to fit your lifestyle',
  },
  {
    title: 'Ride, Earn, and Have Fun',
    body: 'Earn badges, climb leaderboards, and enjoy rewards for consistent use',
  },
] as const;

const { width } = Dimensions.get('window');

export default function Welcome() {
  const [index, setIndex] = useState(0);
  const onScroll = (e: NativeSyntheticEvent<NativeScrollEvent>) =>
    setIndex(Math.round(e.nativeEvent.contentOffset.x / width));

  return (
    <OnboardingScreen>
      <ScrollView
        horizontal
        pagingEnabled
        showsHorizontalScrollIndicator={false}
        onMomentumScrollEnd={onScroll}
        className="flex-1"
      >
        {SLIDES.map((slide) => (
          <View key={slide.title} style={{ width }} className="flex-1 justify-center px-9">
            <Text className="text-center font-psemibold text-2xl text-white">{slide.title}</Text>
            <Text className="mt-6 text-center font-sans text-xl leading-[29px] text-white">
              {slide.body}
            </Text>
          </View>
        ))}
      </ScrollView>

      {/* Figma dot row: active = wide white pill, inactive = small white/40 (252:3315). */}
      <View className="flex-row gap-1.5 px-8 pb-5">
        {SLIDES.map((slide, i) => (
          <View
            key={slide.title}
            className={`h-[7px] rounded-pill ${i === index ? 'w-8 bg-white' : 'w-[7px] bg-white/40'}`}
          />
        ))}
      </View>

      {/* Entry kept as the existing dual CTA (feature-table item 6 dropped). */}
      <View className="px-8 pb-8">
        <KariButton label="Get started" onPress={() => router.push('/(auth)/signup')} />
        <Text
          onPress={() => router.push('/(auth)/signin')}
          className="mt-4 text-center font-sans text-muted"
        >
          I already have an account? <Text className="text-brand">Log in</Text>
        </Text>
      </View>
    </OnboardingScreen>
  );
}
