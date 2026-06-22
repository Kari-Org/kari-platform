import { Ionicons } from '@expo/vector-icons';
import { useQuery } from '@tanstack/react-query';
import * as Location from 'expo-location';
import { useFocusEffect, useRouter } from 'expo-router';
import { setStatusBarStyle } from 'expo-status-bar';
import { useCallback, useEffect, useState } from 'react';
import {
  Dimensions,
  Image,
  type ImageSourcePropType,
  type NativeScrollEvent,
  type NativeSyntheticEvent,
  Pressable,
  ScrollView,
  Text,
  View,
} from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { placesApi, ridersApi } from '@/api/endpoints';
import { fetchTempC } from '@/lib/weather';
import { useSubscriptions } from '@/stores/subscription.store';
import { colors } from '@/theme/tokens';

const { width } = Dimensions.get('window');
const PAGE = 18; // horizontal page padding (Figma left-18)
const CARD_W = width - PAGE * 2.25
const BLOB_RATIO = 477 / 1179; // header-blob.png aspect

type Promo = {
  title: string;
  body: string;
  img: ImageSourcePropType;
  style: { width: number; height: number; right: number; top: number };
};

// Five promo slides, matching the Figma home carousel (each with its 3D render).
const PROMOS: Promo[] = [
  {
    title: 'Hassle-Free Commutes, Every Time!',
    body: 'Book routine rides in advance and enjoy guaranteed pickups at your preferred time',
    img: require('../../assets/home/star.png'),
    style: { width: 132, height: 132, right: -10, top: 12 },
  },
  {
    title: 'Your Music, Your Ride!',
    body: 'Send your playlists to drivers to play during a ride.',
    img: require('../../assets/home/music.png'),
    style: { width: 118, height: 150, right: 8, top: 2 },
  },
  {
    title: 'Save More, Ride Together!',
    body: 'Share your ride with others going the same way and split the fare',
    img: require('../../assets/home/handshake.png'),
    style: { width: 154, height: 120, right: -12, top: 26 },
  },
  {
    title: 'Gift a Ride to Loved Ones!',
    body: 'Surprise family and friends by booking a ride for them in advance.',
    img: require('../../assets/home/gift.png'),
    style: { width: 142, height: 142, right: -6, top: 8 },
  },
  {
    title: 'Smart Fare Estimation',
    body: 'Get real-time fare estimates based on traffic, distance, and demand',
    img: require('../../assets/home/globe.png'),
    style: { width: 138, height: 138, right: -8, top: 12 },
  },
];

export default function Home() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  // Exact blob aspect, but never so short that the greeting crowds the wave.
  const headerH = Math.max(Math.round(width * BLOB_RATIO), insets.top + 112);
  const { data: profile } = useQuery({ queryKey: ['rider-me'], queryFn: ridersApi.me });
  const name = profile?.firstName ?? 'there';
  const subs = useSubscriptions((s) => s.subscriptions);
  const [pickup, setPickup] = useState('Locating…');
  const [temp, setTemp] = useState<number | null>(null);
  const [promo, setPromo] = useState(0);

  // Yellow header needs dark status-bar icons; revert to light for the dark tabs on blur.
  useFocusEffect(
    useCallback(() => {
      setStatusBarStyle('dark');
      return () => setStatusBarStyle('light');
    }, []),
  );

  useEffect(() => {
    void (async () => {
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== 'granted') {
        setPickup('Set your location');
        return;
      }
      const pos = await Location.getCurrentPositionAsync({});
      void fetchTempC(pos.coords.latitude, pos.coords.longitude).then(setTemp);
      try {
        const r = await placesApi.reverse(pos.coords.latitude, pos.coords.longitude);
        setPickup(r.address ?? 'Current location');
      } catch {
        setPickup('Current location');
      }
    })();
  }, []);

  const goBook = () => router.push('/(tabs)/rides');
  const RIDE_TYPES = [
    { key: 'solo', label: 'Solo Ride', onPress: goBook },
    { key: 'carpool', label: 'Carpool', onPress: () => router.push('/carpools') },
    { key: 'subscription', label: 'Subbed Routes', onPress: () => router.push('/subscriptions') },
    { key: 'shuttle', label: 'Shuttle', onPress: () => router.push('/shuttle') },
  ];

  return (
    <View className="flex-1 bg-bg">
      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingTop: headerH, paddingBottom: 28 }}
      >
        <View style={{ paddingHorizontal: PAGE }}>
          {/* Location + search */}
          <View className="mt-4 flex-row items-center justify-between">
            <View className="flex-row items-center">
              <Ionicons name="location-outline" size={16} color="#f8f8f8" />
              <Text className="ml-1.5 font-sans text-[10px] text-[#f8f8f8]">
                Current Location(Pick Up)
              </Text>
            </View>
            <Text onPress={goBook} className="font-sans text-[10px] text-brand">
              Change
            </Text>
          </View>
          <Pressable
            onPress={goBook}
            className="mt-3 flex-row items-center rounded-lg px-3 py-3.5"
            style={{ backgroundColor: '#404040' }}
          >
            <Ionicons name="search-outline" size={18} color="#f8f8f8" />
            <Text numberOfLines={1} className="ml-2 flex-1 font-psemibold text-xs text-[#f8f8f8]">
              {pickup}
              {temp != null ? <Text className="text-brand">{`  ${temp}℃`}</Text> : null}
            </Text>
          </Pressable>

          {/* Promo carousel */}
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
              <View
                key={p.title}
                style={{ width: CARD_W, height: 148 }}
                className="justify-center overflow-hidden rounded-[10px] bg-brand pl-3 mr-1.5"
              >
                <View style={{ width: CARD_W * 0.58 }}>
                  <Text className="font-psemibold text-xl text-black">{p.title}</Text>
                  <Text className="mt-1.5 font-pmedium text-[10px] leading-[14px] text-black">
                    {p.body}
                  </Text>
                </View>
                <Image source={p.img} resizeMode="contain" style={{ position: 'absolute', ...p.style }} />
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

          {/* Ride types */}
          <Text className="mb-3 mt-7 font-psemibold text-[15px] text-[#f8f8f8]">
            Stuck in traffic? Book a Kari now!
          </Text>
          <View className="flex-row justify-between">
            {RIDE_TYPES.map((t) => (
              <Pressable
                key={t.key}
                onPress={t.onPress}
                style={{ width: 70, height: 70 }}
                className="items-center justify-center rounded-lg border border-[#3a3a3a] bg-card p-2.5"
              >
                <Text className="text-center font-sans text-[10px] text-[#f8f8f8]">{t.label}</Text>
              </Pressable>
            ))}
          </View>

          {/* Subscription routes */}
          <View className="mb-4 mt-8 flex-row items-center justify-between">
            <Text className="font-psemibold text-[15px] text-[#f8f8f8]">Subscription Routes</Text>
            <Text
              onPress={() => router.push('/subscriptions')}
              className="font-sans text-[10px] text-muted"
            >
              View
            </Text>
          </View>
          {subs.length === 0 ? (
            <Pressable
              onPress={() => router.push('/subscription-new')}
              className="flex-row items-center rounded-lg border border-hairline bg-card px-4 py-5"
            >
              <View className="h-9 w-9 items-center justify-center rounded-full bg-white">
                <Ionicons name="add" size={20} color={colors.bg} />
              </View>
              <Text className="ml-3 flex-1 font-pmedium text-xs text-white">
                Set up a subscription route for guaranteed daily pickups
              </Text>
            </Pressable>
          ) : (
            <View className="gap-5">
              {subs.slice(0, 4).map((s) => (
                <Pressable
                  key={s.id}
                  onPress={() => router.push('/subscriptions')}
                  className="flex-row items-center"
                >
                  <View className="h-6 w-6 items-center justify-center rounded-full bg-white">
                    <Ionicons name="star" size={13} color={colors.bg} />
                  </View>
                  <View className="ml-3 flex-1">
                    <Text className="font-pmedium text-xs text-white">{s.label}</Text>
                    <Text numberOfLines={1} className="mt-1 font-sans text-[10px] text-muted">
                      {s.pickupAddress} – {s.dropoffAddress}
                    </Text>
                  </View>
                  <View className="ml-2 items-end">
                    <Text className="font-sans text-[10px] text-white">{s.renewsInDays} days left</Text>
                    <Text className="mt-1 font-sans text-[10px] text-brand">
                      {s.status === 'active' ? 'Active' : 'Paused'}
                    </Text>
                  </View>
                </Pressable>
              ))}
            </View>
          )}
        </View>

        {/* Limited-time discount (full-bleed) */}
        <Pressable
          onPress={() => router.push('/carpools')}
          className="mt-7 h-[110px] justify-center overflow-hidden rounded-lg bg-brand px-[18px]"
        >
          <Text className="font-psemibold text-xl text-black">Limited Time Discount</Text>
          <Text className="mt-2 pt-2 text-black">
            <Text className="font-pmedium text-sm text-black">Earn </Text>
            <Text className="font-pbold text-2xl text-black">₦500</Text>
            <Text className="font-pmedium text-sm text-black"> off by Carpooling</Text>
          </Text>
          <Image
            source={require('../../assets/home/moneybag.png')}
            resizeMode="contain"
            style={{ position: 'absolute', right: 16, top: -10, width: 98, height: 124 }}
          />
        </Pressable>
      </ScrollView>

      {/* Pinned header overlay — the page scrolls under it (sticky navbar) */}
      <View style={{ position: 'absolute', top: 0, left: 0, right: 0, height: headerH }}>
        <Image
          source={require('../../assets/home/header-blob.png')}
          resizeMode="stretch"
          style={{ position: 'absolute', top: 0, left: 0, width, height: headerH }}
        />
        <SafeAreaView edges={['top']}>
          <View className="flex-row items-center pt-2">
            <Pressable
              onPress={() => router.push('/(tabs)/account')}
              className="h-12 w-[54px] items-center justify-center rounded-r-full bg-card"
            >
              <Ionicons name="menu" size={26} color="#ffffff" />
            </Pressable>
            <View className="ml-3 flex-1">
              <Text className="font-sans text-base text-bg">Let’s Ride,</Text>
              <Text className="font-pbold text-2xl text-bg">{name}</Text>
            </View>
            <Pressable onPress={() => router.push('/notifications')} className="mr-5">
              <Ionicons name="notifications" size={26} color={colors.bg} />
            </Pressable>
          </View>
        </SafeAreaView>
      </View>
    </View>
  );
}
