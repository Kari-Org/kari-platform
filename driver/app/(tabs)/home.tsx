import { Ionicons } from '@expo/vector-icons';
import { useQuery } from '@tanstack/react-query';
import * as Location from 'expo-location';
import { useRouter } from 'expo-router';
import { useEffect, useRef, useState } from 'react';
import { ActivityIndicator, Alert, Pressable, StyleSheet, Text, View } from 'react-native';
import MapView, { Marker } from 'react-native-maps';
import { SafeAreaView } from 'react-native-safe-area-context';
import { DriverAvailability, RideStatus } from '@kari/types';
import { colors } from '@kari/mobile-core';
import { availabilityApi, driversApi, ridesApi } from '@/api/endpoints';
import { errorMessage } from '@/lib/error';
import { requestLocationPermission, startTracking, stopTracking } from '@/location/tracker';
import { useAvailabilityStore } from '@/stores/availability.store';
import { useRideStore } from '@/stores/ride.store';

const LAGOS = { latitude: 6.5244, longitude: 3.3792 };
const ACTIVE: RideStatus[] = [
  RideStatus.ACCEPTED,
  RideStatus.DRIVER_ARRIVED,
  RideStatus.IN_PROGRESS,
];

export default function Home() {
  const router = useRouter();
  const online = useAvailabilityStore((s) => s.online);
  const setOnline = useAvailabilityStore((s) => s.setOnline);
  const here = useAvailabilityStore((s) => s.lastFix);
  const setFix = useAvailabilityStore((s) => s.setFix);
  const activeRideId = useRideStore((s) => s.activeRideId);
  const setActiveRide = useRideStore((s) => s.setActiveRide);
  const [busy, setBusy] = useState(false);
  const restored = useRef(false);

  const { data: me } = useQuery({ queryKey: ['driver-me'], queryFn: driversApi.me });

  // Restore in-flight state after a cold start: resume an active trip, or
  // reflect an ONLINE availability the server still remembers.
  useEffect(() => {
    if (!me || restored.current) return;
    restored.current = true;
    if (me.availability === DriverAvailability.ON_TRIP && !activeRideId) {
      void ridesApi
        .mine()
        .then((rides) => {
          const active = rides.find((r) => r.driverId === me.userId && ACTIVE.includes(r.status));
          if (active) {
            setActiveRide(active.id);
            router.replace('/ride');
          }
        })
        .catch(() => {});
    } else if (me.availability === DriverAvailability.ONLINE && !online) {
      setOnline(true);
      void startTracking();
    }
  }, [me, activeRideId, online, router, setActiveRide, setOnline]);

  const goOnline = async () => {
    setBusy(true);
    try {
      const ok = await requestLocationPermission();
      if (!ok) {
        Alert.alert('Location needed', 'Enable location access to go online and receive ride requests.');
        return;
      }
      const pos = await Location.getCurrentPositionAsync({ accuracy: Location.Accuracy.Balanced });
      const lat = pos.coords.latitude;
      const lng = pos.coords.longitude;
      setFix({ lat, lng });
      await availabilityApi.online({ lat, lng });
      setOnline(true);
      await startTracking();
    } catch (e) {
      Alert.alert('Could not go online', errorMessage(e));
    } finally {
      setBusy(false);
    }
  };

  const goOffline = async () => {
    setBusy(true);
    try {
      await stopTracking();
      await availabilityApi.offline();
      setOnline(false);
    } catch (e) {
      Alert.alert('Could not go offline', errorMessage(e));
    } finally {
      setBusy(false);
    }
  };

  const region = here
    ? { latitude: here.lat, longitude: here.lng, latitudeDelta: 0.02, longitudeDelta: 0.02 }
    : { ...LAGOS, latitudeDelta: 0.06, longitudeDelta: 0.06 };
  const name = me?.firstName ?? 'there';

  return (
    <View className="flex-1 bg-bg">
      <MapView style={StyleSheet.absoluteFill} region={region} showsUserLocation>
        {here && <Marker coordinate={{ latitude: here.lat, longitude: here.lng }} pinColor={colors.brand} />}
      </MapView>

      <SafeAreaView edges={['top', 'bottom']} style={{ flex: 1, justifyContent: 'space-between' }} pointerEvents="box-none">
        {/* greeting */}
        <View className="mx-4 mt-2 flex-row items-center rounded-card bg-surface/95 px-4 py-3">
          <View className="h-10 w-10 items-center justify-center rounded-full bg-card">
            <Ionicons name="person" size={20} color={colors.brand} />
          </View>
          <View className="ml-3 flex-1">
            <Text className="font-sans text-xs text-subtle">Welcome back,</Text>
            <Text className="font-psemibold text-base text-white">{name}</Text>
          </View>
          <View className="flex-row items-center rounded-pill bg-card px-3 py-1.5">
            <View className={`mr-2 h-2 w-2 rounded-full ${online ? 'bg-success' : 'bg-subtle'}`} />
            <Text className="font-pmedium text-xs text-white">{online ? 'Online' : 'Offline'}</Text>
          </View>
        </View>

        {/* online toggle */}
        <View className="mx-4 mb-2 rounded-card bg-surface px-5 py-5">
          {online ? (
            <>
              <View className="flex-row items-center">
                <ActivityIndicator color={colors.brand} />
                <Text className="ml-3 font-psemibold text-base text-white">Looking for ride requests…</Text>
              </View>
              <Text className="mt-1 font-sans text-sm text-subtle">
                Stay in an area with good signal — new requests appear here automatically.
              </Text>
              <Pressable
                disabled={busy}
                onPress={goOffline}
                className="mt-4 items-center rounded-pill border border-hairline py-3.5"
              >
                <Text className="font-psemibold text-white">{busy ? '…' : 'Go offline'}</Text>
              </Pressable>
            </>
          ) : (
            <>
              <Text className="font-pbold text-lg text-white">You’re offline</Text>
              <Text className="mt-1 font-sans text-sm text-subtle">
                Go online to start receiving ride requests near you.
              </Text>
              <Pressable
                disabled={busy}
                onPress={goOnline}
                className="mt-4 items-center rounded-pill bg-brand py-3.5"
              >
                <Text className="font-psemibold text-bg">{busy ? 'Going online…' : 'Go online'}</Text>
              </Pressable>
            </>
          )}
        </View>
      </SafeAreaView>
    </View>
  );
}
