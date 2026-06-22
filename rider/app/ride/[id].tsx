import { Ionicons } from '@expo/vector-icons';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useCallback, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Dimensions,
  Image,
  Linking,
  Pressable,
  ScrollView,
  Share,
  Text,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { PaymentMethod, PriceType, RideStatus } from '@kari/types';
import { commsApi, ridesApi, safetyApi, walletApi } from '@/api/endpoints';
import type { Ride } from '@/api/types';
import { InputField } from '@/components/InputField';
import { KariButton } from '@/components/KariButton';
import { RideMap } from '@/components/RideMap';
import { Screen } from '@/components/Screen';
import { ScreenHeader } from '@/components/ScreenHeader';
import { env } from '@/lib/env';
import { errorMessage } from '@/lib/error';
import { useRideChannel } from '@/realtime/useRideChannel';
import { useLocationStore } from '@/stores/location.store';
import { colors } from '@/theme/tokens';

const CAR = require('../../assets/ride/car.png');
const { height: SCREEN_H } = Dimensions.get('window');
const TERMINAL: RideStatus[] = [RideStatus.COMPLETED, RideStatus.CANCELLED];
const naira = (n: number | null | undefined) =>
  n == null ? '—' : '₦' + Math.round(n).toString().replace(/\B(?=(\d{3})+(?!\d))/g, ',');
const etaMin = (m: number) => Math.max(1, Math.round(m / 400)); // ~urban 24km/h estimate

function Row({ label, value }: { label: string; value: string }) {
  return (
    <View className="flex-row justify-between py-1">
      <Text className="font-sans text-muted">{label}</Text>
      <Text className="font-psemibold text-white">{value}</Text>
    </View>
  );
}

function ReceiptRow({ label, value }: { label: string; value: string }) {
  return (
    <View className="flex-row items-center justify-between py-1.5">
      <Text className="font-sans text-sm text-muted">{label}</Text>
      <Text numberOfLines={1} className="ml-3 max-w-[62%] font-pmedium text-sm text-white">
        {value}
      </Text>
    </View>
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
  const [safety, setSafety] = useState(false);
  // Ride-end (rate + tip + receipt)
  const [done, setDone] = useState(false);
  const [comment, setComment] = useState('');
  const [tipSel, setTipSel] = useState<number | 'custom' | null>(null);
  const [customTip, setCustomTip] = useState('');
  const [tipMethod, setTipMethod] = useState<PaymentMethod>(PaymentMethod.WALLET);
  const [hasRated, setHasRated] = useState(false);
  const { data: wallet } = useQuery({ queryKey: ['wallet'], queryFn: walletApi.summary });

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
      await qc.invalidateQueries({ queryKey: ['wallet'] });
    } catch (e) {
      Alert.alert('Could not cancel', errorMessage(e));
    } finally {
      setBusy(false);
    }
  };

  const confirmCancel = () => {
    const committed =
      ride != null && [RideStatus.ACCEPTED, RideStatus.DRIVER_ARRIVED].includes(ride.status);
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

  const effectiveTip =
    tipSel === 'custom'
      ? Math.max(0, Math.floor(Number(customTip) || 0))
      : typeof tipSel === 'number'
        ? tipSel
        : 0;

  const submit = async () => {
    setBusy(true);
    try {
      if (!hasRated) {
        await ridesApi.rate(rideId, { stars, comment: comment.trim() || undefined });
        setHasRated(true);
      }
      if (effectiveTip > 0) {
        await ridesApi.tip(rideId, { amount: effectiveTip, method: tipMethod });
      }
      setDone(true);
    } catch (e) {
      const msg = errorMessage(e);
      if (/insufficient/i.test(msg)) {
        Alert.alert('Wallet balance too low', 'Top up to tip from your wallet, or switch the tip to cash.', [
          { text: 'Top up', onPress: () => router.push('/wallet') },
          { text: 'OK', style: 'cancel' },
        ]);
      } else {
        Alert.alert('Could not submit', msg);
      }
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

  // ── Ride end: rate + tip → receipt ──
  if (ride.status === RideStatus.COMPLETED) {
    const fare = ride.agreedPrice ?? ride.quotedPrice ?? 0;
    const walletTip = tipMethod === PaymentMethod.WALLET ? effectiveTip : 0;
    const total = fare + walletTip;
    const lowBalance =
      tipMethod === PaymentMethod.WALLET && effectiveTip > 0 && (wallet?.balance ?? 0) < effectiveTip;

    if (done) {
      return (
        <Screen className="px-5">
          <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ flexGrow: 1 }}>
            <View className="items-center py-8">
              <View
                className="h-16 w-16 items-center justify-center rounded-full"
                style={{ backgroundColor: 'rgba(59,209,122,0.15)' }}
              >
                <Ionicons name="checkmark-circle" size={56} color={colors.success} />
              </View>
              <Text className="mt-4 font-psemibold text-lg text-white">Payment Successful</Text>
              <Text className="mt-1 font-pbold text-4xl text-white">{naira(total)}</Text>
            </View>
            <View className="rounded-card bg-card px-4 py-4">
              <ReceiptRow label="From" value={ride.pickupAddress ?? 'Pickup'} />
              <ReceiptRow label="To" value={ride.dropoffAddress ?? 'Destination'} />
              <ReceiptRow label="Distance" value={`${(ride.distanceMeters / 1000).toFixed(1)} km`} />
              <ReceiptRow label="Trip time" value={`${etaMin(ride.distanceMeters)} min`} />
              <ReceiptRow label="Fare" value={naira(fare)} />
              {effectiveTip > 0 ? (
                <ReceiptRow
                  label="Tip"
                  value={`${naira(effectiveTip)}${tipMethod === PaymentMethod.CASH ? ' (cash)' : ''}`}
                />
              ) : null}
              <ReceiptRow label="Payment" value={ride.paymentMethod} />
              {ride.driver?.name ? <ReceiptRow label="Driver" value={ride.driver.name} /> : null}
              <View className="my-2 h-px bg-hairline" />
              <View className="flex-row items-center justify-between py-1">
                <Text className="font-psemibold text-white">Total paid</Text>
                <Text className="font-pbold text-lg text-brand">{naira(total)}</Text>
              </View>
            </View>
            <View className="mt-6">
              <KariButton label="Close" onPress={() => router.replace('/(tabs)/home')} />
            </View>
          </ScrollView>
        </Screen>
      );
    }

    return (
      <Screen className="px-5">
        <ScrollView
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
          contentContainerStyle={{ paddingBottom: 24 }}
        >
          <Text className="mt-4 text-center font-pbold text-2xl text-white">Trip complete</Text>
          <Text className="mt-1 text-center font-sans text-sm text-subtle">
            {naira(fare)} · {(ride.distanceMeters / 1000).toFixed(1)} km
          </Text>

          <Text className="mb-3 mt-8 text-center font-pmedium text-white">How was your trip?</Text>
          <View className="flex-row justify-center gap-2">
            {[1, 2, 3, 4, 5].map((n) => (
              <Pressable key={n} onPress={() => setStars(n)}>
                <Text style={{ fontSize: 36 }}>{n <= stars ? '⭐' : '☆'}</Text>
              </Pressable>
            ))}
          </View>
          <View className="mt-4">
            <InputField
              label="Add a comment (optional)"
              value={comment}
              onChangeText={setComment}
              placeholder="Anything to share?"
            />
          </View>

          <Text className="mb-2 mt-2 font-psemibold text-base text-white">Tip your driver</Text>
          <View className="flex-row flex-wrap gap-2">
            {[200, 500, 1000].map((amt) => {
              const on = tipSel === amt;
              return (
                <Pressable
                  key={amt}
                  onPress={() => setTipSel(amt)}
                  className={`rounded-pill border px-5 py-2.5 ${on ? 'border-brand bg-brand' : 'border-hairline bg-card'}`}
                >
                  <Text className={`font-pmedium text-sm ${on ? 'text-bg' : 'text-white'}`}>
                    {naira(amt)}
                  </Text>
                </Pressable>
              );
            })}
            <Pressable
              onPress={() => setTipSel('custom')}
              className={`rounded-pill border px-5 py-2.5 ${tipSel === 'custom' ? 'border-brand bg-brand' : 'border-hairline bg-card'}`}
            >
              <Text className={`font-pmedium text-sm ${tipSel === 'custom' ? 'text-bg' : 'text-white'}`}>
                Custom
              </Text>
            </Pressable>
            <Pressable
              onPress={() => {
                setTipSel(null);
                setCustomTip('');
              }}
              className={`rounded-pill border px-5 py-2.5 ${tipSel === null ? 'border-brand bg-brand' : 'border-hairline bg-card'}`}
            >
              <Text className={`font-pmedium text-sm ${tipSel === null ? 'text-bg' : 'text-white'}`}>
                No tip
              </Text>
            </Pressable>
          </View>
          {tipSel === 'custom' ? (
            <View className="mt-3">
              <InputField
                label="Custom tip (₦)"
                value={customTip}
                onChangeText={setCustomTip}
                keyboardType="number-pad"
                placeholder="e.g. 1500"
              />
            </View>
          ) : null}

          {effectiveTip > 0 ? (
            <>
              <View className="mt-3 flex-row gap-2">
                <Pressable
                  onPress={() => setTipMethod(PaymentMethod.WALLET)}
                  className={`flex-1 items-center rounded-pill border py-2.5 ${tipMethod === PaymentMethod.WALLET ? 'border-brand bg-brand/10' : 'border-hairline bg-card'}`}
                >
                  <Text
                    className={`font-pmedium text-sm ${tipMethod === PaymentMethod.WALLET ? 'text-brand' : 'text-muted'}`}
                  >
                    Wallet
                  </Text>
                </Pressable>
                <Pressable
                  onPress={() => setTipMethod(PaymentMethod.CASH)}
                  className={`flex-1 items-center rounded-pill border py-2.5 ${tipMethod === PaymentMethod.CASH ? 'border-brand bg-brand/10' : 'border-hairline bg-card'}`}
                >
                  <Text
                    className={`font-pmedium text-sm ${tipMethod === PaymentMethod.CASH ? 'text-brand' : 'text-muted'}`}
                  >
                    Cash
                  </Text>
                </Pressable>
              </View>
              {tipMethod === PaymentMethod.WALLET ? (
                <View className="mt-2 flex-row items-center justify-between">
                  <Text className="font-sans text-xs text-subtle">
                    Wallet balance: <Text className="text-white">{naira(wallet?.balance ?? 0)}</Text>
                  </Text>
                  {lowBalance ? (
                    <Pressable onPress={() => router.push('/wallet')} hitSlop={8}>
                      <Text className="font-pmedium text-xs text-brand">Top up</Text>
                    </Pressable>
                  ) : null}
                </View>
              ) : null}
            </>
          ) : null}

          <View className="mt-8">
            <KariButton
              label={effectiveTip > 0 ? `Submit · tip ${naira(effectiveTip)}` : 'Submit'}
              onPress={submit}
              loading={busy}
              disabled={lowBalance}
            />
          </View>
        </ScrollView>
      </Screen>
    );
  }
  if (ride.status === RideStatus.CANCELLED) {
    return (
      <Screen className="px-5">
        <ScreenHeader />
        <View className="flex-1 items-center justify-center">
          <Text className="text-center font-pbold text-2xl text-white">Ride cancelled</Text>
          <View className="mt-6 w-full">
            <KariButton label="Back home" onPress={() => router.replace('/(tabs)/home')} />
          </View>
        </View>
      </Screen>
    );
  }

  // ── Live states: persistent map + bottom sheet ──
  const matched =
    ride.status === RideStatus.ACCEPTED || ride.status === RideStatus.DRIVER_ARRIVED;

  return (
    <View className="flex-1 bg-bg">
      <RideMap
        pickup={{ lat: ride.pickupLat, lng: ride.pickupLng }}
        dropoff={{ lat: ride.dropoffLat, lng: ride.dropoffLng }}
        bottomInset={360}
        style={{ flex: 1 }}
      />
      <SafeAreaView edges={['top']} className="absolute left-0 right-0 top-0">
        <View className="px-5 pt-2">
          <Pressable
            onPress={() => router.back()}
            className="h-11 w-11 items-center justify-center rounded-full bg-card"
          >
            <Ionicons name="chevron-back" size={22} color="#ffffff" />
          </Pressable>
        </View>
      </SafeAreaView>

      <ScrollView
        style={{ position: 'absolute', left: 0, right: 0, bottom: 0, maxHeight: SCREEN_H * 0.74 }}
        className="rounded-t-[28px] bg-card"
        contentContainerStyle={{ paddingHorizontal: 20, paddingTop: 12, paddingBottom: 28 }}
        showsVerticalScrollIndicator={false}
      >
        <View className="mb-3 h-1 w-10 self-center rounded-full bg-hairline" />

        {/* Searching / negotiating */}
        {(ride.status === RideStatus.SEARCHING ||
          ride.status === RideStatus.OFFERED ||
          ride.status === RideStatus.NEGOTIATING) && (
          <View>
            <View className="items-center py-4">
              <ActivityIndicator color={colors.brand} />
              <Text className="mt-4 text-center font-psemibold text-lg text-white">
                Searching for drivers…
              </Text>
              <Text className="mt-1 text-center font-sans text-muted">
                {ride.priceType === PriceType.NEGOTIATE
                  ? `Your offer: ${naira(ride.riderProposedPrice)}`
                  : `Fare: ${naira(ride.quotedPrice)}`}
              </Text>
            </View>
            {offers.length > 0 && (
              <View className="mt-2">
                <Text className="mb-2 font-pmedium text-white">Driver offers</Text>
                {offers.map((o) => (
                  <View
                    key={o.offerId}
                    className="mb-2 flex-row items-center justify-between rounded-card bg-surface px-4 py-3"
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
            <View className="mt-4">
              <KariButton label="Cancel ride" variant="outline" onPress={confirmCancel} loading={busy} />
            </View>
          </View>
        )}

        {/* Driver matched / arrived */}
        {matched && (
          <View>
            <View className="flex-row items-center">
              <View className="h-12 w-12 items-center justify-center rounded-full bg-surface">
                <Ionicons name="person" size={24} color={colors.brand} />
              </View>
              <View className="ml-3 flex-1">
                <Text className="font-psemibold text-base text-white">
                  {ride.driver?.name ?? 'Your driver'}
                </Text>
                {ride.driver?.vehicle ? (
                  <Text numberOfLines={1} className="font-sans text-xs text-subtle">
                    {[ride.driver.vehicle.color, ride.driver.vehicle.model].filter(Boolean).join(' ')} ·{' '}
                    {ride.driver.vehicle.plateNumber}
                  </Text>
                ) : null}
                {ride.driver && ride.driver.ratingCount > 0 ? (
                  <Text className="font-sans text-xs text-brand">
                    ★ {ride.driver.ratingAvg.toFixed(1)} · {ride.driver.ratingCount} trips
                  </Text>
                ) : null}
              </View>
              <Text className="font-pmedium text-xs text-brand">
                {ride.status === RideStatus.DRIVER_ARRIVED ? 'Arrived' : 'On the way'}
              </Text>
            </View>

            <Image source={CAR} resizeMode="contain" style={{ width: '100%', height: 110, marginTop: 8 }} />

            <View className="flex-row items-center justify-between">
              <View className="flex-row items-center gap-2">
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
                <Text className="ml-1 font-pmedium text-sm text-white">Contact Driver</Text>
              </View>
              <Pressable onPress={confirmCancel} hitSlop={8}>
                <Text className="font-pmedium text-sm text-danger">Cancel Ride</Text>
              </Pressable>
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

            <View className="mt-1 flex-row items-center justify-between">
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
        )}

        {/* In progress */}
        {ride.status === RideStatus.IN_PROGRESS && (
          <View>
            <Text className="text-center font-psemibold text-lg text-white">Ride in Progress</Text>
            <View className="mt-4 flex-row items-center justify-between">
              <Text className="font-sans text-sm text-muted">Time to Destination</Text>
              <Text className="font-psemibold text-sm text-white">
                {etaMin(ride.distanceMeters)} minutes
              </Text>
            </View>
            <View className="mt-2 flex-row items-center justify-between">
              <Text className="font-sans text-sm text-muted">Ride price</Text>
              <Text className="font-pbold text-base text-brand">{naira(ride.agreedPrice)}</Text>
            </View>
            <Text numberOfLines={1} className="mt-2 font-sans text-xs text-subtle">
              Heading to {ride.dropoffAddress ?? 'your destination'}
            </Text>

            <View className="mt-4 flex-row items-center rounded-card bg-surface p-4">
              <Ionicons name="shield-checkmark-outline" size={18} color={colors.brand} />
              <Text className="ml-2 flex-1 font-sans text-sm text-white">Are you feeling unsafe?</Text>
              <Pressable
                onPress={() => setSafety((s) => !s)}
                className="rounded-pill border border-brand px-4 py-1.5"
              >
                <Text className="font-pmedium text-xs text-brand">{safety ? 'Hide' : 'Show'}</Text>
              </Pressable>
            </View>
            {safety ? (
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
            ) : null}
          </View>
        )}
      </ScrollView>
    </View>
  );
}
