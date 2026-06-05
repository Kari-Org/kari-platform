import { Ionicons } from '@expo/vector-icons';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useCallback, useState } from 'react';
import { ActivityIndicator, Alert, Linking, Pressable, ScrollView, Share, Text, View } from 'react-native';
import MapView, { Marker } from 'react-native-maps';
import { PriceType, RideStatus } from '@kari/types';
import { commsApi, ridesApi, safetyApi } from '@/api/endpoints';
import type { Ride } from '@/api/types';
import { InputField } from '@/components/InputField';
import { KariButton } from '@/components/KariButton';
import { Screen } from '@/components/Screen';
import { ScreenHeader } from '@/components/ScreenHeader';
import { env } from '@/lib/env';
import { errorMessage } from '@/lib/error';
import { useRideChannel } from '@/realtime/useRideChannel';
import { useLocationStore } from '@/stores/location.store';
import { colors } from '@/theme/tokens';

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

function RideMap({ ride }: { ride: Ride }) {
  const midLat = (ride.pickupLat + ride.dropoffLat) / 2;
  const midLng = (ride.pickupLng + ride.dropoffLng) / 2;
  const latDelta = Math.max(0.02, Math.abs(ride.pickupLat - ride.dropoffLat) * 1.8);
  const lngDelta = Math.max(0.02, Math.abs(ride.pickupLng - ride.dropoffLng) * 1.8);
  return (
    <MapView
      style={{ height: 220, borderRadius: 16 }}
      pointerEvents="none"
      region={{ latitude: midLat, longitude: midLng, latitudeDelta: latDelta, longitudeDelta: lngDelta }}
    >
      <Marker coordinate={{ latitude: ride.pickupLat, longitude: ride.pickupLng }} pinColor={colors.brand} />
      <Marker coordinate={{ latitude: ride.dropoffLat, longitude: ride.dropoffLng }} title="Destination" />
    </MapView>
  );
}

export default function RideScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const rideId = String(id);
  const router = useRouter();
  const qc = useQueryClient();
  const current = useLocationStore((s) => s.current);
  const [offers, setOffers] = useState<{ offerId: string; amount: number }[]>([]);
  const [stars, setStars] = useState(5);
  const [busy, setBusy] = useState(false);
  const [notes, setNotes] = useState('');
  const [playlist, setPlaylist] = useState('');

  const { data: ride } = useQuery({
    queryKey: ['ride', rideId],
    queryFn: () => ridesApi.get(rideId),
    refetchInterval: (q) => (q.state.data && TERMINAL.includes(q.state.data.status) ? false : 4000),
  });

  const onEvent = useCallback(
    (evt: string, payload: unknown) => {
      const p = payload as { offerId?: string; amount?: number };
      if (evt === 'ride:offer:driver' && p?.offerId) {
        setOffers((prev) =>
          prev.some((o) => o.offerId === p.offerId)
            ? prev
            : [...prev, { offerId: p.offerId as string, amount: p.amount ?? 0 }],
        );
      } else {
        void qc.invalidateQueries({ queryKey: ['ride', rideId] });
      }
    },
    [qc, rideId],
  );
  useRideChannel(onEvent);

  const refetch = () => qc.invalidateQueries({ queryKey: ['ride', rideId] });

  const cancel = async () => {
    setBusy(true);
    try {
      await ridesApi.cancel(rideId);
      await refetch();
      // A late cancel may have charged a penalty — refresh the wallet balance.
      await qc.invalidateQueries({ queryKey: ['wallet'] });
    } catch (e) {
      Alert.alert('Could not cancel', errorMessage(e));
    } finally {
      setBusy(false);
    }
  };

  const confirmCancel = () => {
    const committed =
      ride != null &&
      [RideStatus.ACCEPTED, RideStatus.DRIVER_ARRIVED].includes(ride.status);
    Alert.alert(
      'Cancel ride?',
      committed
        ? 'A driver is already on the way — a cancellation fee (₦500) may apply.'
        : 'Are you sure you want to cancel this ride?',
      [
        { text: 'Keep ride', style: 'cancel' },
        { text: 'Cancel ride', style: 'destructive', onPress: () => void cancel() },
      ],
    );
  };

  const acceptOffer = async (offerId: string) => {
    setBusy(true);
    try {
      await ridesApi.acceptOffer(rideId, offerId);
      setOffers([]);
      await refetch();
    } catch (e) {
      Alert.alert('Could not accept offer', errorMessage(e));
    } finally {
      setBusy(false);
    }
  };

  const submitRating = async () => {
    setBusy(true);
    try {
      await ridesApi.rate(rideId, { stars });
      router.replace('/(tabs)/home');
    } catch (e) {
      Alert.alert('Could not submit rating', errorMessage(e));
    } finally {
      setBusy(false);
    }
  };

  const shareLiveTrip = async () => {
    try {
      const link = await safetyApi.share(rideId);
      await Share.share({ message: `Track my Kari trip live: ${env.apiBaseUrl}${link.url}` });
    } catch (e) {
      Alert.alert('Could not create link', errorMessage(e));
    }
  };

  const openChat = () => router.push({ pathname: '/chat/[rideId]', params: { rideId } });

  const makeCall = async () => {
    try {
      const call = await commsApi.call(rideId);
      Alert.alert(
        'Connecting call',
        `Dial ${call.proxyNumber} to reach your driver — both numbers stay private.`,
        [
          { text: 'Close', style: 'cancel' },
          { text: 'Call', onPress: () => void Linking.openURL(`tel:${call.proxyNumber}`) },
        ],
      );
    } catch (e) {
      Alert.alert('Could not start call', errorMessage(e));
    }
  };

  const sos = () =>
    Alert.alert(
      'Send SOS?',
      'Alerts your emergency contacts and our safety team with your live location.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Send SOS',
          style: 'destructive',
          onPress: async () => {
            try {
              const lat = current?.lat ?? ride?.pickupLat ?? 0;
              const lng = current?.lng ?? ride?.pickupLng ?? 0;
              await safetyApi.panic({ rideId, lat, lng });
              Alert.alert('SOS sent', 'Your emergency contacts and our safety team have been alerted.');
            } catch (e) {
              Alert.alert('Could not send SOS', errorMessage(e));
            }
          },
        },
      ],
    );

  if (!ride) {
    return (
      <Screen className="items-center justify-center">
        <ActivityIndicator color={colors.brand} />
      </Screen>
    );
  }

  const DriverCard = () => (
    <View className="mt-4 rounded-card bg-card p-4">
      <View className="flex-row items-center">
        <View className="h-12 w-12 items-center justify-center rounded-full bg-surface">
          <Ionicons name="person" size={24} color={colors.brand} />
        </View>
        <View className="ml-3 flex-1">
          <Text className="font-psemibold text-base text-white">{ride.driver?.name ?? 'Your driver'}</Text>
          {ride.driver?.vehicle ? (
            <Text className="font-sans text-xs text-subtle" numberOfLines={1}>
              {[ride.driver.vehicle.color, ride.driver.vehicle.model].filter(Boolean).join(' ')} ·{' '}
              {ride.driver.vehicle.plateNumber}
            </Text>
          ) : (
            <Text className="font-sans text-xs text-subtle">
              {ride.status === RideStatus.DRIVER_ARRIVED ? 'Has arrived' : 'On the way'}
            </Text>
          )}
          {ride.driver && ride.driver.ratingCount > 0 ? (
            <Text className="font-sans text-xs text-brand">
              ★ {ride.driver.ratingAvg.toFixed(1)} · {ride.driver.ratingCount} trips
            </Text>
          ) : null}
        </View>
        <View className="flex-row gap-2">
          <Pressable
            onPress={makeCall}
            className="h-10 w-10 items-center justify-center rounded-full bg-surface"
          >
            <Ionicons name="call" size={18} color={colors.brand} />
          </Pressable>
          <Pressable
            onPress={openChat}
            className="h-10 w-10 items-center justify-center rounded-full bg-surface"
          >
            <Ionicons name="chatbubble-ellipses" size={18} color={colors.brand} />
          </Pressable>
        </View>
      </View>

      <View className="mt-4 items-center rounded-card bg-surface py-5">
        <Text className="font-sans text-xs text-muted">Show this PIN to start the ride</Text>
        <Text className="mt-1 font-pbold text-4xl tracking-[8px] text-brand">
          {ride.startOtp ?? '----'}
        </Text>
      </View>

      <View className="mt-3">
        <Row label="Agreed fare" value={naira(ride.agreedPrice ?? ride.quotedPrice)} />
      </View>

      <View className="mt-3">
        <InputField
          label="Additional notes for the driver"
          value={notes}
          onChangeText={setNotes}
          placeholder="e.g. I'm by the blue gate"
        />
        <InputField
          label="Playlist (Spotify link)"
          value={playlist}
          onChangeText={setPlaylist}
          placeholder="https://open.spotify.com/..."
          autoCapitalize="none"
        />
      </View>

      <View className="mt-2 flex-row items-center justify-between">
        <Pressable onPress={shareLiveTrip} className="flex-row items-center">
          <Ionicons name="share-social" size={18} color={colors.brand} />
          <Text className="ml-2 font-pmedium text-sm text-brand">Share live trip</Text>
        </Pressable>
        <Pressable onPress={sos} className="flex-row items-center">
          <Ionicons name="alert-circle" size={18} color={colors.danger} />
          <Text className="ml-1.5 font-pmedium text-sm text-danger">SOS</Text>
        </Pressable>
      </View>
    </View>
  );

  const body = () => {
    switch (ride.status) {
      case RideStatus.SEARCHING:
      case RideStatus.OFFERED:
      case RideStatus.NEGOTIATING:
        return (
          <View className="flex-1 items-center justify-center py-16">
            <ActivityIndicator color={colors.brand} />
            <Text className="mt-4 text-center font-psemibold text-lg text-white">
              Searching for drivers…
            </Text>
            <Text className="mt-1 text-center font-sans text-muted">
              {ride.priceType === PriceType.NEGOTIATE
                ? `Your offer: ${naira(ride.riderProposedPrice)}`
                : `Fare: ${naira(ride.quotedPrice)}`}
            </Text>
            {offers.length > 0 && (
              <View className="mt-8 w-full">
                <Text className="mb-2 font-pmedium text-white">Driver offers</Text>
                {offers.map((o) => (
                  <View
                    key={o.offerId}
                    className="mb-2 flex-row items-center justify-between rounded-card bg-card px-4 py-3"
                  >
                    <Text className="font-psemibold text-brand">{naira(o.amount)}</Text>
                    <Pressable
                      onPress={() => acceptOffer(o.offerId)}
                      className="rounded-pill bg-brand px-5 py-2"
                    >
                      <Text className="font-psemibold text-bg">Accept</Text>
                    </Pressable>
                  </View>
                ))}
              </View>
            )}
          </View>
        );
      case RideStatus.ACCEPTED:
      case RideStatus.DRIVER_ARRIVED:
        return (
          <View>
            <RideMap ride={ride} />
            <DriverCard />
          </View>
        );
      case RideStatus.IN_PROGRESS:
        return (
          <View>
            <RideMap ride={ride} />
            <View className="mt-4 rounded-card bg-card p-5">
              <Text className="font-pbold text-xl text-white">On your way 🚗</Text>
              <Text className="mt-1 font-sans text-muted">
                Heading to {ride.dropoffAddress ?? 'your destination'}
              </Text>
              <View className="mt-3">
                <Row label="Agreed fare" value={naira(ride.agreedPrice)} />
              </View>
              <View className="mt-3 flex-row items-center justify-between">
                <Pressable onPress={shareLiveTrip} className="flex-row items-center">
                  <Ionicons name="share-social" size={18} color={colors.brand} />
                  <Text className="ml-2 font-pmedium text-sm text-brand">Share live trip</Text>
                </Pressable>
                <Pressable onPress={sos} className="flex-row items-center">
                  <Ionicons name="alert-circle" size={18} color={colors.danger} />
                  <Text className="ml-1.5 font-pmedium text-sm text-danger">SOS</Text>
                </Pressable>
              </View>
            </View>
          </View>
        );
      case RideStatus.COMPLETED:
        return (
          <View className="py-6">
            <Text className="text-center font-pbold text-2xl text-white">Trip complete</Text>
            <View className="mt-4 rounded-card bg-card px-4 py-4">
              <Row label="Fare paid" value={naira(ride.agreedPrice)} />
              <Row label="Distance" value={`${(ride.distanceMeters / 1000).toFixed(1)} km`} />
              <Row label="Payment" value={ride.paymentMethod} />
            </View>
            <Text className="mb-2 mt-8 text-center font-pmedium text-white">Rate your driver</Text>
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
            <Text className="text-center font-pbold text-2xl text-white">Ride cancelled</Text>
            <View className="mt-6">
              <KariButton label="Back home" onPress={() => router.replace('/(tabs)/home')} />
            </View>
          </View>
        );
      default:
        return null;
    }
  };

  const showCancel = ![
    RideStatus.COMPLETED,
    RideStatus.CANCELLED,
    RideStatus.IN_PROGRESS,
  ].includes(ride.status);

  return (
    <Screen className="px-5">
      <ScreenHeader />
      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ flexGrow: 1 }}>
        <Text className="mt-4 font-pmedium text-sm text-subtle">
          RIDE · {ride.status.replace('_', ' ')}
        </Text>
        {body()}
        {showCancel && (
          <View className="pb-8 pt-4">
            <KariButton label="Cancel ride" variant="outline" onPress={confirmCancel} loading={busy} />
          </View>
        )}
      </ScrollView>
    </Screen>
  );
}
