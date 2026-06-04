import { Ionicons } from '@expo/vector-icons';
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
import { Screen } from '@/components/Screen';
import { colors } from '@/theme/tokens';

const SLIDES = [
  {
    icon: 'shield-checkmark',
    title: 'Your Safety is Our Priority',
    body: 'Verified drivers, OTP confirmation, and a panic button for emergencies.',
  },
  {
    icon: 'car-sport',
    title: 'Rides Tailored for You',
    body: 'Choose shuttles, carpooling, or subscriptions to fit your lifestyle.',
  },
  {
    icon: 'trophy',
    title: 'Ride, Earn, and Have Fun',
    body: 'Earn badges, climb leaderboards, and enjoy rewards for riding with Kari.',
  },
] as const;

const { width } = Dimensions.get('window');

export default function Welcome() {
  const [index, setIndex] = useState(0);
  const onScroll = (e: NativeSyntheticEvent<NativeScrollEvent>) =>
    setIndex(Math.round(e.nativeEvent.contentOffset.x / width));

  return (
    <Screen>
      <ScrollView
        horizontal
        pagingEnabled
        showsHorizontalScrollIndicator={false}
        onMomentumScrollEnd={onScroll}
        className="flex-1"
      >
        {SLIDES.map((slide) => (
          <View key={slide.title} style={{ width }} className="flex-1 items-center justify-center px-8">
            <View className="mb-10 h-44 w-44 items-center justify-center rounded-full bg-brand/10">
              <Ionicons name={slide.icon} size={72} color={colors.brand} />
            </View>
            <Text className="text-center font-pbold text-2xl text-white">{slide.title}</Text>
            <Text className="mt-3 text-center font-sans text-base text-muted">{slide.body}</Text>
          </View>
        ))}
      </ScrollView>

      <View className="flex-row justify-center gap-2 pb-6">
        {SLIDES.map((slide, i) => (
          <View
            key={slide.title}
            className={`h-2 rounded-pill ${i === index ? 'w-6 bg-brand' : 'w-2 bg-subtle'}`}
          />
        ))}
      </View>

      <View className="px-5 pb-8">
        <KariButton label="Get started" onPress={() => router.push('/(auth)/signup')} />
        <Text onPress={() => router.push('/(auth)/signin')} className="mt-4 text-center font-sans text-muted">
          I already have an account? <Text className="text-brand">Log in</Text>
        </Text>
      </View>
    </Screen>
  );
}
