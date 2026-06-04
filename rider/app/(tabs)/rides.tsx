import { Ionicons } from '@expo/vector-icons';
import { useQuery } from '@tanstack/react-query';
import * as Location from 'expo-location';
import { useRouter } from 'expo-router';
import { useEffect, useRef, useState } from 'react';
import {
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  Text,
  View,
} from 'react-native';
import MapView, { Marker } from 'react-native-maps';
import { RideStatus } from '@kari/types';
import { placesApi, ridersApi, ridesApi } from '@/api/endpoints';
import type { PlaceSuggestion, Ride, SavedAddress } from '@/api/types';
import { AddressAutocomplete } from '@/components/AddressAutocomplete';
import { KariButton } from '@/components/KariButton';
import { Screen } from '@/components/Screen';
import { useLocationStore } from '@/stores/location.store';
import { colors } from '@/theme/tokens';

const TERMINAL: RideStatus[] = [RideStatus.COMPLETED, RideStatus.CANCELLED];
const LAGOS = { latitude: 6.5244, longitude: 3.3792, latitudeDelta: 0.05, longitudeDelta: 0.05 };

export default function RidesBooking() {
  const router = useRouter();
  const mapRef = useRef<MapView>(null);
  const { current, setCurrent, setPickup, setDropoff } = useLocationStore();
  const [pickupAddr, setPickupAddr] = useState('Locating…');
  const [dest, setDest] = useState('');

  // Poll my rides so we can block a second booking while one is active.
  const { data: rides } = useQuery({
    queryKey: ['my-rides'],
    queryFn: ridesApi.mine,
    refetchInterval: 5000,
  });
  const active = rides?.find((r: Ride) => !TERMINAL.includes(r.status));
  const { data: addresses } = useQuery({
    queryKey: ['rider-addresses'],
    queryFn: ridersApi.listAddresses,
  });

  useEffect(() => {
    void (async () => {
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== 'granted') {
        setPickupAddr('Set your location');
        return;
      }
      const pos = await Location.getCurrentPositionAsync({});
      const c = { lat: pos.coords.latitude, lng: pos.coords.longitude };
      setCurrent({ ...c, address: 'Current location' });
      mapRef.current?.animateToRegion(
        { latitude: c.lat, longitude: c.lng, latitudeDelta: 0.02, longitudeDelta: 0.02 },
        700,
      );
      try {
        const r = await placesApi.reverse(c.lat, c.lng);
        const address = r.address ?? 'Current location';
        setPickupAddr(address);
        setCurrent({ ...c, address });
      } catch {
        setPickupAddr('Current location');
      }
    })();
  }, [setCurrent]);

  const beginBooking = (drop: { lat: number; lng: number; address: string }) => {
    setPickup(current ? { ...current, address: pickupAddr } : null);
    setDropoff(drop);
    router.push('/book');
  };

  if (active) {
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
                {active.status === RideStatus.SEARCHING
                  ? 'Finding you a driver'
                  : active.status.replace(/_/g, ' ').toLowerCase()}
              </Text>
              <Text numberOfLines={1} className="font-sans text-xs text-subtle">
                To {active.dropoffAddress ?? 'your destination'}
              </Text>
            </View>
          </View>
          <View className="mt-4">
            <KariButton
              label="View ride"
              onPress={() => router.push({ pathname: '/ride/[id]', params: { id: active.id } })}
            />
          </View>
        </View>
        <Text className="mt-4 text-center font-sans text-sm text-subtle">
          You can book a new ride once this one finishes.
        </Text>
      </Screen>
    );
  }

  return (
    <Screen className="px-5">
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        className="flex-1"
      >
        <Text className="mb-3 mt-4 font-pbold text-2xl text-white">Where are you going?</Text>

        <View className="mb-3 flex-row items-center rounded-input bg-card px-4 py-4">
          <View className="h-2.5 w-2.5 rounded-full bg-brand" />
          <Text numberOfLines={1} className="ml-3 flex-1 font-sans text-sm text-white">
            {pickupAddr}
          </Text>
        </View>

        <AddressAutocomplete
          value={dest}
          onChangeText={setDest}
          onSelect={(p: PlaceSuggestion) =>
            beginBooking({ lat: p.lat, lng: p.lng, address: p.description })
          }
          near={current ?? undefined}
          placeholder="Where to?"
        />

        {addresses && addresses.length > 0 ? (
          <View>
            {addresses.slice(0, 3).map((a: SavedAddress) => (
              <Pressable
                key={a.id}
                onPress={() => beginBooking({ lat: a.lat, lng: a.lng, address: a.address })}
                className="flex-row items-center border-b border-hairline py-3"
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

        <View className="mt-3 flex-1 overflow-hidden rounded-card">
          <MapView
            ref={mapRef}
            style={{ flex: 1 }}
            initialRegion={LAGOS}
            showsUserLocation
            showsMyLocationButton={false}
          >
            {current ? (
              <Marker
                coordinate={{ latitude: current.lat, longitude: current.lng }}
                pinColor={colors.brand}
              />
            ) : null}
          </MapView>
        </View>
      </KeyboardAvoidingView>
    </Screen>
  );
}
