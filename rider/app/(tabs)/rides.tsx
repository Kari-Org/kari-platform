import { Ionicons } from '@expo/vector-icons';
import { useQuery } from '@tanstack/react-query';
import * as Location from 'expo-location';
import { useRouter } from 'expo-router';
import { useEffect, useMemo, useRef, useState } from 'react';
import {
  ActivityIndicator,
  Animated,
  Dimensions,
  PanResponder,
  Pressable,
  TextInput,
  Text,
  View,
  ScrollView,
} from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { RideStatus } from '@kari/types';
import { placesApi, ridersApi, ridesApi } from '@/api/endpoints';
import type { PlaceSuggestion, Ride, SavedAddress } from '@/api/types';
import { KariButton } from '@/components/KariButton';
import { RideMap } from '@/components/RideMap';
import { Screen } from '@/components/Screen';
import { useLocationStore } from '@/stores/location.store';
import { colors } from '@/theme/tokens';

const TERMINAL: RideStatus[] = [RideStatus.COMPLETED, RideStatus.CANCELLED];
type Coords = { lat: number; lng: number };

const { height: H } = Dimensions.get('window');

export default function RidesBooking() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { current, setCurrent, setPickup, setDropoff } = useLocationStore();

  const [pickupText, setPickupText] = useState('Locating…');
  const [pickupCoords, setPickupCoords] = useState<Coords | null>(null);
  const [dropText, setDropText] = useState('');
  const [active, setActive] = useState<'pickup' | 'drop' | null>(null);
  const [suggestions, setSuggestions] = useState<PlaceSuggestion[]>([]);
  const [sugLoading, setSugLoading] = useState(false);
  const [contentH, setContentH] = useState(0);

  // Draggable sheet (RN core Animated + PanResponder — no extra deps).
  // Sized from the measured tab-content height minus the status-bar inset, so the
  // top snap lands right under the status bar (not behind it). translateY: 0 = fully up.
  const sheetH = Math.max(1, contentH - insets.top);
  const snap = useMemo(
    () => ({
      top: 0,
      mid: Math.max(0, sheetH - contentH * 0.5),
      peek: Math.max(0, sheetH - contentH * 0.3),
    }),
    [sheetH, contentH],
  );
  const snapRef = useRef(snap);
  snapRef.current = snap;

  const ty = useRef(new Animated.Value(H * 0.6)).current;
  const tyVal = useRef(H * 0.6);
  const startTy = useRef(0);
  const inited = useRef(false);
  useEffect(() => {
    const idl = ty.addListener(({ value }) => {
      tyVal.current = value;
    });
    return () => ty.removeListener(idl);
  }, [ty]);
  // Settle at the peek snap once the content area has been measured.
  useEffect(() => {
    if (contentH > 0 && !inited.current) {
      inited.current = true;
      ty.setValue(snap.peek);
    }
  }, [contentH, snap.peek, ty]);
  const snapTo = (t: number) =>
    Animated.spring(ty, { toValue: t, useNativeDriver: false, speed: 14, bounciness: 3 }).start();
  const pan = useRef(
    PanResponder.create({
      onMoveShouldSetPanResponder: (_, g) => Math.abs(g.dy) > 4,
      onPanResponderGrant: () => {
        startTy.current = tyVal.current;
      },
      onPanResponderMove: (_, g) => {
        const s = snapRef.current;
        ty.setValue(Math.min(s.peek, Math.max(s.top, startTy.current + g.dy)));
      },
      onPanResponderRelease: (_, g) => {
        const s = snapRef.current;
        const cur = Math.min(s.peek, Math.max(s.top, startTy.current + g.dy));
        const points = [s.top, s.mid, s.peek];
        let target: number;
        if (g.vy > 0.6) target = cur < s.mid ? s.mid : s.peek;
        else if (g.vy < -0.6) target = cur > s.mid ? s.mid : s.top;
        else target = points.reduce((a, b) => (Math.abs(b - cur) < Math.abs(a - cur) ? b : a));
        snapTo(target);
      },
    }),
  ).current;

  const { data: rides } = useQuery({
    queryKey: ['my-rides'],
    queryFn: ridesApi.mine,
    refetchInterval: 5000,
  });
  const activeRide = rides?.find((r: Ride) => !TERMINAL.includes(r.status));
  const { data: addresses } = useQuery({
    queryKey: ['rider-addresses'],
    queryFn: ridersApi.listAddresses,
  });

  useEffect(() => {
    void (async () => {
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== 'granted') {
        setPickupText('Set your location');
        return;
      }
      const pos = await Location.getCurrentPositionAsync({});
      const c = { lat: pos.coords.latitude, lng: pos.coords.longitude };
      setPickupCoords(c);
      setCurrent({ ...c, address: 'Current location' });
      try {
        const r = await placesApi.reverse(c.lat, c.lng);
        const address = r.address ?? 'Current location';
        setPickupText(address);
        setCurrent({ ...c, address });
      } catch {
        setPickupText('Current location');
      }
    })();
  }, [setCurrent]);

  // Debounced autocomplete for whichever field is focused.
  useEffect(() => {
    const q = (active === 'pickup' ? pickupText : active === 'drop' ? dropText : '').trim();
    if (!active || q.length < 3) {
      setSuggestions([]);
      return;
    }
    setSugLoading(true);
    const handle = setTimeout(async () => {
      try {
        setSuggestions(await placesApi.autocomplete(q, current ?? undefined));
      } catch {
        setSuggestions([]);
      } finally {
        setSugLoading(false);
      }
    }, 300);
    return () => clearTimeout(handle);
  }, [active, pickupText, dropText, current]);

  const focusField = (field: 'pickup' | 'drop') => {
    setActive(field);
    snapTo(snap.mid);
  };

  const proceed = (drop: { lat: number; lng: number; address: string }) => {
    const pk = pickupCoords ?? (current ? { lat: current.lat, lng: current.lng } : null);
    setPickup(pk ? { ...pk, address: pickupText } : null);
    setDropoff(drop);
    router.push('/book');
  };

  const choose = (p: PlaceSuggestion) => {
    setSuggestions([]);
    if (active === 'pickup') {
      setPickupText(p.description);
      setPickupCoords({ lat: p.lat, lng: p.lng });
      setCurrent({ lat: p.lat, lng: p.lng, address: p.description });
      setActive('drop');
    } else {
      setDropText(p.description);
      setActive(null);
      proceed({ lat: p.lat, lng: p.lng, address: p.description });
    }
  };

  // Active ride — block new booking.
  if (activeRide) {
    return (
      <Screen className="px-5">
        <Text className="mb-4 mt-4 font-pbold text-2xl text-white">Your ride</Text>
        <View className="rounded-card bg-card p-5">
          <View className="flex-row items-center">
            <View className="h-10 w-10 items-center justify-center rounded-full bg-surface">
              <ActivityIndicator color={colors.brand} />
            </View>
            <View className="ml-3 flex-1">
              <Text className="font-psemibold text-white">
                {activeRide.status === RideStatus.SEARCHING
                  ? 'Finding you a driver'
                  : activeRide.status.replace(/_/g, ' ').toLowerCase()}
              </Text>
              <Text numberOfLines={1} className="font-sans text-xs text-subtle">
                To {activeRide.dropoffAddress ?? 'your destination'}
              </Text>
            </View>
          </View>
          <View className="mt-4">
            <KariButton
              label="View ride"
              onPress={() => router.push({ pathname: '/ride/[id]', params: { id: activeRide.id } })}
            />
          </View>
        </View>
        <Text className="mt-4 text-center font-sans text-sm text-subtle">
          You can book a new ride once this one finishes.
        </Text>
      </Screen>
    );
  }

  const showSaved = !suggestions.length && addresses && addresses.length > 0;

  return (
    <View
      className="flex-1 bg-bg"
      onLayout={(e) => setContentH(e.nativeEvent.layout.height)}
    >
      <RideMap
        pickup={pickupCoords ?? (current ? { lat: current.lat, lng: current.lng } : null)}
        bottomInset={Math.round(H * 0.34)}
        style={{ flex: 1 }}
      />

      <SafeAreaView edges={['top']} className="absolute left-0 right-0 top-0">
        <View className="flex-row items-center justify-between px-5 pt-2">
          <Pressable
            onPress={() => router.push('/(tabs)/account')}
            className="h-11 w-11 items-center justify-center rounded-full bg-card"
          >
            <Ionicons name="menu" size={22} color="#ffffff" />
          </Pressable>
          <Pressable
            onPress={() => router.push('/notifications')}
            className="h-11 w-11 items-center justify-center rounded-full bg-brand"
          >
            <Ionicons name="notifications" size={20} color={colors.bg} />
          </Pressable>
        </View>
      </SafeAreaView>

      {contentH > 0 ? (
      <Animated.View
        style={{
          position: 'absolute',
          left: 0,
          right: 0,
          bottom: 0,
          height: sheetH,
          transform: [{ translateY: ty }],
          backgroundColor: colors.card,
          borderTopLeftRadius: 28,
          borderTopRightRadius: 28,
        }}
      >
        {/* Draggable handle + header */}
        <View {...pan.panHandlers} className="px-5 pb-1 pt-3">
          <View className="h-1 w-10 self-center rounded-full bg-hairline" />
          <View className="mt-3 flex-row items-center justify-between">
            <Text className="font-sans text-[11px] text-muted">Current Location (Pick Up)</Text>
            <Pressable onPress={() => focusField('pickup')} hitSlop={8}>
              <Text className="font-sans text-[11px] text-brand">Change</Text>
            </Pressable>
          </View>
        </View>

        <ScrollView
          className="flex-1"
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
          contentContainerStyle={{ paddingHorizontal: 20, paddingBottom: 40 }}
        >
          {/* Pickup — editable, pre-filled */}
          <View
            className={`flex-row items-center rounded-input bg-surface px-4 ${
              active === 'pickup' ? 'border border-brand' : ''
            }`}
          >
            <View className="h-2.5 w-2.5 rounded-full bg-brand" />
            <TextInput
              value={pickupText}
              onChangeText={setPickupText}
              onFocus={() => focusField('pickup')}
              placeholder="Pickup location"
              placeholderTextColor={colors.subtle}
              style={{ flex: 1, paddingHorizontal: 12, paddingVertical: 14, color: '#fff', fontSize: 14 }}
            />
          </View>

          {/* Dropoff — tapping snaps the sheet to the middle */}
          <View
            className={`mt-3 flex-row items-center rounded-input bg-surface px-4 ${
              active === 'drop' ? 'border border-brand' : ''
            }`}
          >
            <Ionicons name="location" size={16} color={colors.danger} />
            <TextInput
              value={dropText}
              onChangeText={setDropText}
              onFocus={() => focusField('drop')}
              placeholder="Where do you want to go?"
              placeholderTextColor={colors.subtle}
              style={{ flex: 1, paddingHorizontal: 12, paddingVertical: 14, color: '#fff', fontSize: 14 }}
            />
            {sugLoading ? <ActivityIndicator color={colors.subtle} /> : null}
          </View>

          {/* Suggestions */}
          {suggestions.map((s) => (
            <Pressable
              key={s.placeId}
              onPress={() => choose(s)}
              className="flex-row items-center border-b border-hairline py-3.5"
            >
              <Ionicons name="location-outline" size={16} color={colors.brand} />
              <Text numberOfLines={2} className="ml-3 flex-1 font-sans text-sm text-white">
                {s.description}
              </Text>
            </Pressable>
          ))}

          {/* Saved places */}
          {showSaved ? (
            <View className="mt-3">
              <Text className="mb-1 font-pmedium text-xs text-subtle">Saved places</Text>
              {addresses.slice(0, 5).map((a: SavedAddress) => (
                <Pressable
                  key={a.id}
                  onPress={() => {
                    setDropText(a.address);
                    setActive(null);
                    proceed({ lat: a.lat, lng: a.lng, address: a.address });
                  }}
                  className="flex-row items-center border-b border-hairline py-3.5"
                >
                  <Ionicons
                    name={a.label === 'HOME' ? 'home' : a.label === 'WORK' ? 'briefcase' : 'location'}
                    size={18}
                    color={colors.subtle}
                  />
                  <Text numberOfLines={1} className="ml-3 flex-1 font-sans text-sm text-white">
                    {a.address}
                  </Text>
                </Pressable>
              ))}
            </View>
          ) : null}
        </ScrollView>
      </Animated.View>
      ) : null}
    </View>
  );
}
