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
import { KariButton, Screen, colors } from '@kari/mobile-core';

const SLIDES = [
  {
    icon: 'wallet',
    title: 'Your Journey, Your Rules',
    body: 'Earn on your terms with fast payouts and tools to track every trip.',
  },
  {
    icon: 'time',
    title: 'Flexibility at Your Fingertips',
    body: 'Choose your hours and accept the rides that fit your schedule.',
  },
  {
    icon: 'shield-checkmark',
    title: 'Drive Safe, Earn More',
    body: 'Verified riders, start-PIN trips, and in-app support on every ride.',
  },
] as const;

const { width } = Dimensions.get('window');

export default function Welcome() {
  const [index, setIndex] = useState(0);
  return (
    <Screen>
      <ScrollView
        horizontal
        pagingEnabled
        showsHorizontalScrollIndicator={false}
        onMomentumScrollEnd={(e: NativeSyntheticEvent<NativeScrollEvent>) =>
          setIndex(Math.round(e.nativeEvent.contentOffset.x / width))
        }
        className="flex-1"
      >
        {SLIDES.map((s) => (
          <View key={s.title} style={{ width }} className="flex-1 items-center justify-center px-8">
            <View className="mb-10 h-44 w-44 items-center justify-center rounded-full bg-brand/10">
              <Ionicons name={s.icon} size={72} color={colors.brand} />
            </View>
            <Text className="text-center font-pbold text-2xl text-white">{s.title}</Text>
            <Text className="mt-3 text-center font-sans text-base text-muted">{s.body}</Text>
          </View>
        ))}
      </ScrollView>

      <View className="flex-row justify-center gap-2 pb-6">
        {SLIDES.map((s, i) => (
          <View
            key={s.title}
            className={`h-2 rounded-pill ${i === index ? 'w-6 bg-brand' : 'w-2 bg-subtle'}`}
          />
        ))}
      </View>

      <View className="px-5 pb-8">
        <KariButton label="Get started" onPress={() => router.push('/(auth)/signup')} />
        <Text
          onPress={() => router.push('/(auth)/signin')}
          className="mt-4 text-center font-sans text-muted"
        >
          I already have an account? <Text className="text-brand">Log in</Text>
        </Text>
      </View>
    </Screen>
  );
}
