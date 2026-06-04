import { Ionicons } from '@expo/vector-icons';
import { useQuery } from '@tanstack/react-query';
import * as Location from 'expo-location';
import { useRouter } from 'expo-router';
import { useEffect, useState } from 'react';
import {
  Alert,
  Dimensions,
  type NativeScrollEvent,
  type NativeSyntheticEvent,
  Pressable,
  ScrollView,
  Text,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { placesApi, ridersApi } from '@/api/endpoints';
import { colors } from '@/theme/tokens';

const { width } = Dimensions.get('window');
const CARD_W = width - 40;

const PROMOS = [
  {
    title: 'Hassle-Free Commutes, Every Time!',
    body: 'Book routine rides in advance and enjoy guaranteed pickups at your preferred time.',
  },
  {
    title: 'Ride Safe, Ride Verified',
    body: 'Every driver is KYC-verified, with OTP confirmation and a panic button on every trip.',
  },
  {
    title: 'Earn As You Ride',
    body: 'Collect badges, climb the leaderboard, and unlock rewards for riding with Kari.',
  },
];

const RIDE_TYPES = [
  { key: 'solo', label: 'Solo Ride', icon: 'person', live: true },
  { key: 'carpool', label: 'Carpool', icon: 'people', live: false },
  { key: 'subscription', label: 'Subscription Routes', icon: 'repeat', live: false },
  { key: 'shuttle', label: 'Shuttle', icon: 'bus', live: false },
] as const;

export default function Home() {
  const router = useRouter();
  const { data: profile } = useQuery({ queryKey: ['rider-me'], queryFn: ridersApi.me });
  const name = profile?.firstName ?? 'there';
  const [pickup, setPickup] = useState('Locating…');
  const [promo, setPromo] = useState(0);

  useEffect(() => {
    void (async () => {
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== 'granted') {
        setPickup('Set your location');
        return;
      }
      const pos = await Location.getCurrentPositionAsync({});
      try {
        const r = await placesApi.reverse(pos.coords.latitude, pos.coords.longitude);
        setPickup(r.address ?? 'Current location');
      } catch {
        setPickup('Current location');
      }
    })();
  }, []);

  const goBook = () => router.push('/(tabs)/rides');
  const onType = (t: (typeof RIDE_TYPES)[number]) =>
    t.live ? goBook() : Alert.alert('Coming soon', `${t.label} arrives in a later phase.`);

  return (
    <View className="flex-1 bg-bg">
      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 24 }}>
        <SafeAreaView edges={['top']} style={{ backgroundColor: colors.brand }}>
          <View className="rounded-b-[32px] bg-brand px-5 pb-7 pt-2">
            <View className="flex-row items-center justify-between">
              <View className="h-11 w-11 items-center justify-center rounded-full bg-bg">
                <Ionicons name="menu" size={22} color={colors.brand} />
              </View>
              <Ionicons name="notifications" size={22} color={colors.bg} />
            </View>
            <Text className="mt-3 font-pmedium text-sm text-bg">Let’s Ride,</Text>
            <Text className="font-pbold text-3xl text-bg">{name}</Text>
          </View>
        </SafeAreaView>

        <View className="px-5">
          <View className="mt-5 flex-row items-center justify-between">
            <View className="flex-row items-center">
              <Ionicons name="location-outline" size={16} color={colors.muted} />
              <Text className="ml-1 font-pmedium text-xs text-muted">Current Location (Pick Up)</Text>
            </View>
            <Text onPress={goBook} className="font-pmedium text-xs text-brand">
              Change
            </Text>
          </View>
          <Pressable
            onPress={goBook}
            className="mt-2 flex-row items-center rounded-input bg-card px-4 py-4"
          >
            <Ionicons name="search" size={18} color={colors.subtle} />
            <Text numberOfLines={1} className="ml-3 flex-1 font-sans text-sm text-white">
              {pickup}
            </Text>
          </Pressable>

          <ScrollView
            horizontal
            pagingEnabled
            showsHorizontalScrollIndicator={false}
            onMomentumScrollEnd={(e: NativeSyntheticEvent<NativeScrollEvent>) =>
              setPromo(Math.round(e.nativeEvent.contentOffset.x / CARD_W))
            }
            className="mt-5"
          >
            {PROMOS.map((p) => (
              <View key={p.title} style={{ width: CARD_W }} className="rounded-card bg-brand p-5">
                <Text className="font-pbold text-xl text-bg">{p.title}</Text>
                <Text className="mt-2 font-sans text-xs text-bg">{p.body}</Text>
              </View>
            ))}
          </ScrollView>
          <View className="mt-3 flex-row justify-center gap-1.5">
            {PROMOS.map((p, i) => (
              <View
                key={p.title}
                className={`h-1.5 rounded-full ${i === promo ? 'w-4 bg-brand' : 'w-1.5 bg-hairline'}`}
              />
            ))}
          </View>

          <Text className="mb-3 mt-6 font-psemibold text-base text-white">
            Stuck in traffic? Book a Kari now!
          </Text>
          <ScrollView horizontal showsHorizontalScrollIndicator={false}>
            {RIDE_TYPES.map((t) => (
              <Pressable
                key={t.key}
                onPress={() => onType(t)}
                className="mr-3 w-28 items-start rounded-card border border-hairline bg-card px-4 py-5"
              >
                <Ionicons name={t.icon} size={22} color={colors.brand} />
                <Text className="mt-3 font-pmedium text-sm text-white">{t.label}</Text>
                <Text className="mt-0.5 font-sans text-[10px] text-subtle">
                  {t.live ? 'Available now' : 'Coming soon'}
                </Text>
              </Pressable>
            ))}
          </ScrollView>

          <View className="mb-3 mt-7 flex-row items-center justify-between">
            <Text className="font-psemibold text-base text-white">Subscription Routes</Text>
            <Text className="font-pmedium text-xs text-subtle">View</Text>
          </View>
          <View className="items-center rounded-card border border-hairline bg-card px-4 py-7">
            <Ionicons name="repeat" size={24} color={colors.subtle} />
            <Text className="mt-2 text-center font-sans text-xs text-subtle">
              Subscription routes (guaranteed daily pickups) arrive in a later phase.
            </Text>
          </View>

          <View className="mb-2 mt-6 flex-row items-center rounded-card bg-brand p-5">
            <View className="flex-1">
              <Text className="font-pbold text-lg text-bg">Limited Time Discount</Text>
              <Text className="mt-1 font-pmedium text-sm text-bg">Earn ₦500 off by Carpooling</Text>
            </View>
            <Text style={{ fontSize: 40 }}>💰</Text>
          </View>
        </View>
      </ScrollView>
    </View>
  );
}
