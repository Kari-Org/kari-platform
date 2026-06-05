import { Ionicons } from '@expo/vector-icons';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { useRouter } from 'expo-router';
import { useCallback, useEffect, useState } from 'react';
import { ActivityIndicator, Alert, Linking, Pressable, ScrollView, Share, Text, View } from 'react-native';
import MapView, { Marker } from 'react-native-maps';
import { OtpInput } from 'react-native-otp-entry';
import { RideStatus } from '@kari/types';
import { KariButton, Screen, colors } from '@kari/mobile-core';
import { commsApi, ridesApi, safetyApi } from '@/api/endpoints';
import type { Ride } from '@/api/types';
import { env } from '@/lib/env';
import { errorMessage } from '@/lib/error';
import { useDispatchChannel } from '@/realtime/useDispatchChannel';
import { useAvailabilityStore } from '@/stores/availability.store';
import { useRideStore } from '@/stores/ride.store';

const TERMINAL: RideStatus[] = [RideStatus.COMPLETED, RideStatus.CANCELLED];
const naira = (n: number | null | undefined) =>
  n == null ? '—' : '₦' + Math.round(n).toString().replace(/\B(?=(\d{3})+(?!\d))/g, ',');

function Row({ label, value }: { label: string; value: string }) {
  return (
    <View className="flex-row justify-between py-1">
      <Text className="font-sans text-muted">{label}</Text>
      <Text className="font-psemibold text-white">{value}</Text>
    </View>
  );
}

function SafetyButton({
  icon,
  label,
  onPress,
  danger,
}: {
  icon: keyof typeof Ionicons.glyphMap;
  label: string;
  onPress: () => void;
  danger?: boolean;
}) {
  return (
    <Pressable onPress={onPress} className="flex-1 items-center rounded-card bg-card py-3">
      <Ionicons name={icon} size={20} color={danger ? colors.danger : colors.brand} />
      <Text className={`mt-1 font-pmedium text-xs ${danger ? 'text-danger' : 'text-white'}`}>{label}</Text>
    </Pressable>
  );
}

function RideMap({ ride, here }: { ride: Ride; here: { lat: number; lng: number } | null }) {
  const lats = [ride.pickupLat, ride.dropoffLat, ...(here ? [here.lat] : [])];
  const lngs = [ride.pickupLng, ride.dropoffLng, ...(here ? [here.lng] : [])];
  const midLat = (Math.min(...lats) + Math.max(...lats)) / 2;
  const midLng = (Math.min(...lngs) + Math.max(...lngs)) / 2;
  const latDelta = Math.max(0.02, (Math.max(...lats) - Math.min(...lats)) * 1.8);
  const lngDelta = Math.max(0.02, (Math.max(...lngs) - Math.min(...lngs)) * 1.8);
  return (
    <MapView
      style={{ height: 220, borderRadius: 16 }}
      pointerEvents="none"
      region={{ latitude: midLat, longitude: midLng, latitudeDelta: latDelta, longitudeDelta: lngDelta }}
    >
      <Marker coordinate={{ latitude: ride.pickupLat, longitude: ride.pickupLng }} title="Pickup" pinColor={colors.brand} />
      <Marker coordinate={{ latitude: ride.dropoffLat, longitude: ride.dropoffLng }} title="Destination" />
      {here && <Marker coordinate={{ latitude: here.lat, longitude: here.lng }} title="You" pinColor="#4F9DFF" />}
    </MapView>
  );
}

export default function DriverRideScreen() {
  const router = useRouter();
  const qc = useQueryClient();
  const activeRideId = useRideStore((s) => s.activeRideId);
  const setActiveRide = useRideStore((s) => s.setActiveRide);
  const here = useAvailabilityStore((s) => s.lastFix);
  const rideId = activeRideId ?? '';

  const [pin, setPin] = useState('');
  const [stars, setStars] = useState(5);
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    if (!activeRideId) router.replace('/(tabs)/home');
  }, [activeRideId, router]);

  const { data: ride } = useQuery({
    queryKey: ['driver-ride', rideId],
    queryFn: () => ridesApi.get(rideId),
    enabled: !!activeRideId,
    refetchInterval: (q) => (q.state.data && TERMINAL.includes(q.state.data.status) ? false : 4000),
  });

  const onEvent = useCallback(() => {
    void qc.invalidateQueries({ queryKey: ['driver-ride', rideId] });
  }, [qc, rideId]);
  useDispatchChannel(onEvent);

  const refetch = () => qc.invalidateQueries({ queryKey: ['driver-ride', rideId] });

  const act = async (fn: () => Promise<unknown>, errTitle: string) => {
    setBusy(true);
    try {
      await fn();
      await refetch();
    } catch (e) {
      Alert.alert(errTitle, errorMessage(e));
    } finally {
      setBusy(false);
    }
  };

  const leaveHome = () => {
    setActiveRide(null);
    router.replace('/(tabs)/home');
  };

  const confirmCancel = () =>
    Alert.alert('Cancel trip?', 'The rider will be notified.', [
      { text: 'Keep trip', style: 'cancel' },
      {
        text: 'Cancel trip',
        style: 'destructive',
        onPress: () =>
          act(async () => {
            await ridesApi.cancel(rideId);
            leaveHome();
          }, 'Could not cancel'),
      },
    ]);

  const submitRating = () =>
    act(async () => {
      await ridesApi.rate(rideId, { stars });
      leaveHome();
    }, 'Could not submit rating');

  const navigateTo = (lat: number, lng: number) =>
    void Linking.openURL(`https://www.google.com/maps/dir/?api=1&destination=${lat},${lng}`).catch(
      () => Alert.alert('Maps unavailable', 'Could not open navigation.'),
    );

  if (!ride) {
    return (
      <Screen className="items-center justify-center">
        <ActivityIndicator color={colors.brand} />
      </Screen>
    );
  }

  const fare = naira(ride.agreedPrice ?? ride.quotedPrice);
  const km = (ride.distanceMeters / 1000).toFixed(1);

  const openChat = () => router.push({ pathname: '/chat/[rideId]', params: { rideId } });

  const makeCall = async () => {
    try {
      const call = await commsApi.call(rideId);
      Alert.alert(
        'Connecting call',
        `Dial ${call.proxyNumber} to reach your rider — both numbers stay private.`,
        [
          { text: 'Close', style: 'cancel' },
          { text: 'Call', onPress: () => void Linking.openURL(`tel:${call.proxyNumber}`) },
        ],
      );
    } catch (e) {
      Alert.alert('Could not start call', errorMessage(e));
    }
  };

  const shareLiveTrip = async () => {
    try {
      const link = await safetyApi.share(rideId);
      await Share.share({ message: `Follow my Kari trip live: ${env.apiBaseUrl}${link.url}` });
    } catch (e) {
      Alert.alert('Could not share trip', errorMessage(e));
    }
  };

  const sendSos = () =>
    Alert.alert('Send SOS?', 'This alerts your emergency contacts with your live location.', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Send SOS',
        style: 'destructive',
        onPress: async () => {
          try {
            const evt = await safetyApi.panic({
              rideId,
              lat: here?.lat ?? ride.pickupLat,
              lng: here?.lng ?? ride.pickupLng,
            });
            Alert.alert(
              'SOS sent',
              evt.contactsAlerted > 0
                ? `${evt.contactsAlerted} emergency contact${evt.contactsAlerted > 1 ? 's' : ''} alerted.`
                : 'Help has been notified.',
            );
          } catch (e) {
            Alert.alert('Could not send SOS', errorMessage(e));
          }
        },
      },
    ]);

  const RouteCard = () => (
    <View className="mt-4 rounded-card bg-card p-4">
      <View className="flex-row">
        <Ionicons name="ellipse" size={12} color={colors.success} />
        <Text className="ml-3 flex-1 font-pmedium text-sm text-white" numberOfLines={2}>
          {ride.pickupAddress ?? 'Pickup'}
        </Text>
      </View>
      <View className="ml-[5px] h-5 w-px bg-hairline" />
      <View className="flex-row">
        <Ionicons name="location" size={13} color={colors.danger} />
        <Text className="ml-3 flex-1 font-pmedium text-sm text-white" numberOfLines={2}>
          {ride.dropoffAddress ?? 'Destination'}
        </Text>
      </View>
      <View className="mt-3 border-t border-hairline pt-3">
        {ride.rider ? (
          <Row
            label="Rider"
            value={
              ride.rider.ratingCount > 0
                ? `${ride.rider.name} · ★${ride.rider.ratingAvg.toFixed(1)}`
                : ride.rider.name
            }
          />
        ) : null}
        <Row label="You earn" value={fare} />
        <Row label="Distance" value={`${km} km`} />
        <Row label="Payment" value={ride.paymentMethod} />
      </View>
    </View>
  );

  const body = () => {
    switch (ride.status) {
      case RideStatus.ACCEPTED:
        return (
          <View>
            <RideMap ride={ride} here={here} />
            <View className="mt-4 rounded-card bg-card p-4">
              <Text className="font-pbold text-lg text-white">On the way to pick up</Text>
              <Text className="mt-1 font-sans text-sm text-muted">
                Picking up {ride.rider?.name ?? 'your rider'} at {ride.pickupAddress ?? 'the pickup point'}.
              </Text>
            </View>
            <RouteCard />
            <View className="mt-4">
              <KariButton
                label="Navigate to pickup"
                variant="outline"
                onPress={() => navigateTo(ride.pickupLat, ride.pickupLng)}
              />
              <View className="mt-2">
                <KariButton label="I’ve arrived" onPress={() => act(() => ridesApi.arrived(rideId), 'Could not update')} loading={busy} />
              </View>
            </View>
          </View>
        );
      case RideStatus.DRIVER_ARRIVED:
        return (
          <View>
            <RideMap ride={ride} here={here} />
            <View className="mt-4 rounded-card bg-card p-5">
              <Text className="font-pbold text-lg text-white">Verify the rider</Text>
              <Text className="mb-4 mt-1 font-sans text-sm text-muted">
                Ask {ride.rider?.name ?? 'your rider'} for their 4-digit start PIN.
              </Text>
              <OtpInput
                numberOfDigits={4}
                focusColor={colors.brand}
                onTextChange={setPin}
                onFilled={setPin}
                theme={{
                  pinCodeContainerStyle: { backgroundColor: colors.surface, borderColor: colors.hairline },
                  pinCodeTextStyle: { color: '#ffffff' },
                }}
              />
            </View>
            <View className="mt-4">
              <KariButton
                label="Start trip"
                onPress={() => act(() => ridesApi.start(rideId, pin), 'Could not start')}
                loading={busy}
                disabled={pin.length !== 4}
              />
            </View>
          </View>
        );
      case RideStatus.IN_PROGRESS:
        return (
          <View>
            <RideMap ride={ride} here={here} />
            <View className="mt-4 rounded-card bg-card p-5">
              <Text className="font-pbold text-xl text-white">Trip in progress 🚗</Text>
              <Text className="mt-1 font-sans text-muted">
                Heading to {ride.dropoffAddress ?? 'the destination'}.
              </Text>
              <View className="mt-3">
                <Row label="You earn" value={fare} />
              </View>
            </View>
            <View className="mt-4">
              <KariButton
                label="Navigate to destination"
                variant="outline"
                onPress={() => navigateTo(ride.dropoffLat, ride.dropoffLng)}
              />
              <View className="mt-2">
                <KariButton label="Complete trip" onPress={() => act(() => ridesApi.complete(rideId), 'Could not complete')} loading={busy} />
              </View>
            </View>
          </View>
        );
      case RideStatus.COMPLETED:
        return (
          <View className="py-4">
            <View className="items-center">
              <View className="h-16 w-16 items-center justify-center rounded-full bg-success/15">
                <Ionicons name="checkmark-circle" size={44} color={colors.success} />
              </View>
              <Text className="mt-4 font-pbold text-2xl text-white">Trip complete</Text>
            </View>
            <View className="mt-5 rounded-card bg-card px-4 py-4">
              <Row label="You earned" value={fare} />
              <Row label="Distance" value={`${km} km`} />
              <Row label="Payment" value={ride.paymentMethod} />
            </View>
            <Text className="mb-2 mt-8 text-center font-pmedium text-white">Rate your rider</Text>
            <View className="flex-row justify-center gap-2">
              {[1, 2, 3, 4, 5].map((n) => (
                <Pressable key={n} onPress={() => setStars(n)}>
                  <Text style={{ fontSize: 34 }}>{n <= stars ? '⭐' : '☆'}</Text>
                </Pressable>
              ))}
            </View>
            <View className="mt-8">
              <KariButton label="Submit & finish" onPress={submitRating} loading={busy} />
            </View>
          </View>
        );
      case RideStatus.CANCELLED:
        return (
          <View className="py-16">
            <Text className="text-center font-pbold text-2xl text-white">Trip cancelled</Text>
            <Text className="mt-2 text-center font-sans text-muted">This trip was cancelled.</Text>
            <View className="mt-6">
              <KariButton label="Back to home" onPress={leaveHome} />
            </View>
          </View>
        );
      default:
        return (
          <View className="py-16 items-center">
            <ActivityIndicator color={colors.brand} />
          </View>
        );
    }
  };

  const showCancel =
    ride.status === RideStatus.ACCEPTED || ride.status === RideStatus.DRIVER_ARRIVED;
  const showSafety =
    ride.status === RideStatus.ACCEPTED ||
    ride.status === RideStatus.DRIVER_ARRIVED ||
    ride.status === RideStatus.IN_PROGRESS;

  return (
    <Screen className="px-5">
      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ flexGrow: 1, paddingBottom: 24 }}>
        <Text className="mt-2 font-pmedium text-sm text-subtle" style={{ marginTop: 8 }}>
          TRIP · {ride.status.replace(/_/g, ' ')}
        </Text>
        {body()}
        {showSafety && (
          <View className="mt-4 flex-row gap-2">
            <SafetyButton icon="chatbubble-ellipses" label="Chat" onPress={openChat} />
            <SafetyButton icon="call" label="Call" onPress={makeCall} />
            <SafetyButton icon="share-social" label="Share" onPress={shareLiveTrip} />
            <SafetyButton icon="warning" label="SOS" danger onPress={sendSos} />
          </View>
        )}
        {showCancel && (
          <View className="pt-4">
            <KariButton label="Cancel trip" variant="outline" onPress={confirmCancel} loading={busy} />
          </View>
        )}
      </ScrollView>
    </Screen>
  );
}
