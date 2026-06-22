import { Ionicons } from '@expo/vector-icons';
import { useQuery } from '@tanstack/react-query';
import { useRouter } from 'expo-router';
import { useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Dimensions,
  Image,
  Pressable,
  ScrollView,
  Text,
  TextInput,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useKeyboardDone } from '@kari/mobile-core';
import { CarCategory, KycStatus, PaymentMethod, PriceType } from '@kari/types';
import { carpoolsApi, ridersApi, ridesApi, walletApi } from '@/api/endpoints';
import type { Quote } from '@/api/types';
import { Checkbox } from '@/components/Checkbox';
import { KariButton } from '@/components/KariButton';
import { RideMap } from '@/components/RideMap';
import { errorMessage } from '@/lib/error';
import { useLocationStore } from '@/stores/location.store';
import { colors } from '@/theme/tokens';

const CAR = require('../assets/ride/car.png');
const { height: SCREEN_H } = Dimensions.get('window');

const CLASS_META: Record<string, { label: string; desc: string }> = {
  ECONOMY: { label: 'Economy', desc: 'Affordable everyday rides' },
  COMFORT: { label: 'Comfort', desc: 'Newer cars, more legroom' },
  PREMIUM: { label: 'Premium', desc: 'Top-rated drivers' },
};

const PAYMENTS = [
  { value: PaymentMethod.CASH, label: 'Cash', icon: 'cash-outline' as const },
  { value: PaymentMethod.CARD, label: 'Card', icon: 'card-outline' as const },
  { value: PaymentMethod.WALLET, label: 'Wallet', icon: 'wallet-outline' as const },
];

const naira = (n: number) => '₦' + Math.round(n).toString().replace(/\B(?=(\d{3})+(?!\d))/g, ',');

const formatTrip = (seconds: number) => {
  const min = Math.max(1, Math.round(seconds / 60));
  if (min < 60) return `~${min} min`;
  const h = Math.floor(min / 60);
  const m = min % 60;
  return `~${h}h${m ? ` ${m}m` : ''}`;
};

export default function Book() {
  const router = useRouter();
  const { pickup, dropoff } = useLocationStore();
  const { data: wallet } = useQuery({ queryKey: ['wallet'], queryFn: walletApi.summary });
  const { data: profile } = useQuery({ queryKey: ['rider-me'], queryFn: ridersApi.me });
  const [rideType, setRideType] = useState<'solo' | 'carpool'>('solo');
  const [quote, setQuote] = useState<Quote | null>(null);
  const [quoting, setQuoting] = useState(true);
  const [category, setCategory] = useState<CarCategory>(CarCategory.ECONOMY);
  const [payment, setPayment] = useState<PaymentMethod>(PaymentMethod.CASH);
  const [negotiate, setNegotiate] = useState(false);
  const [proposed, setProposed] = useState('');
  const [loading, setLoading] = useState(false);
  const { inputAccessoryViewID, accessory } = useKeyboardDone('number-pad');

  // Redirect home if we landed here without a booking context — never navigate during render.
  useEffect(() => {
    if (!pickup || !dropoff) router.replace('/(tabs)/home');
  }, [pickup, dropoff, router]);

  // Fetch the fare quote on mount.
  useEffect(() => {
    if (!pickup || !dropoff) return;
    let cancelled = false;
    setQuoting(true);
    void (async () => {
      try {
        const q = await ridesApi.quote({
          pickupLat: pickup.lat,
          pickupLng: pickup.lng,
          pickupAddress: pickup.address,
          dropoffLat: dropoff.lat,
          dropoffLng: dropoff.lng,
          dropoffAddress: dropoff.address,
        });
        if (cancelled) return;
        setQuote(q);
        setCategory(q.fares[0]?.category ?? CarCategory.ECONOMY);
      } catch (e) {
        if (!cancelled) Alert.alert('Could not get fare', errorMessage(e));
      } finally {
        if (!cancelled) setQuoting(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [pickup, dropoff]);

  if (!pickup || !dropoff) return null;

  const fare = quote?.fares.find((f) => f.category === category);

  const request = async () => {
    if (!quote) return;
    if (rideType === 'carpool') return startCarpool();
    setLoading(true);
    try {
      const res = await ridesApi.request({
        quoteRef: quote.ref,
        carCategory: category,
        paymentMethod: payment,
        priceType: negotiate ? PriceType.NEGOTIATE : PriceType.STANDARD,
        riderProposedPrice: negotiate ? Number(proposed) : undefined,
      });
      router.replace({ pathname: '/ride/[id]', params: { id: res.ride.id } });
    } catch (e) {
      Alert.alert('Could not request ride', errorMessage(e));
    } finally {
      setLoading(false);
    }
  };

  const startCarpool = async () => {
    if (!quote) return;
    if (profile?.ninStatus !== KycStatus.VERIFIED) {
      Alert.alert('Verify your NIN', 'Carpooling is NIN-gated so co-riders can trust each other.', [
        { text: 'Not now', style: 'cancel' },
        { text: 'Verify NIN', onPress: () => router.push('/verify-nin') },
      ]);
      return;
    }
    setLoading(true);
    try {
      const res = await carpoolsApi.create({ quoteRef: quote.ref, carCategory: category });
      router.replace({ pathname: '/carpool/[id]', params: { id: res.carpool.id } });
    } catch (e) {
      const msg = errorMessage(e);
      if (/NIN/i.test(msg)) router.push('/verify-nin');
      else Alert.alert('Could not start carpool', msg);
    } finally {
      setLoading(false);
    }
  };

  // Negotiate = a focused "name your price" mode: prefill the selected fare, then
  // adjust with the steppers or by typing directly.
  const toggleNegotiate = (on: boolean) => {
    setNegotiate(on);
    if (on) setProposed(String(fare?.amount ?? ''));
  };
  const adjustOffer = (delta: number) =>
    setProposed((p) => String(Math.max(500, (Number(p) || 0) + delta)));

  const ctaLabel =
    rideType === 'carpool'
      ? `Start carpool · ${naira(fare?.amount ?? 0)}`
      : negotiate
        ? `Request · offer ${naira(Number(proposed) || 0)}`
        : `Select ride · ${naira(fare?.amount ?? 0)}`;

  return (
    <View className="flex-1 bg-bg">
      {/* Persistent map */}
      <View className="flex-1">
        <RideMap
          pickup={{ lat: pickup.lat, lng: pickup.lng }}
          dropoff={{ lat: dropoff.lat, lng: dropoff.lng }}
          bottomInset={90}
        />
        <SafeAreaView edges={['top']} className="absolute left-0 right-0 top-0">
          <View className="flex-row items-center justify-between px-5 pt-2">
            <Pressable
              onPress={() => router.back()}
              className="h-11 w-11 items-center justify-center rounded-full bg-card"
            >
              <Ionicons name="chevron-back" size={22} color="#ffffff" />
            </Pressable>
            <Pressable
              onPress={() => router.replace('/(tabs)/home')}
              className="h-11 items-center justify-center rounded-full bg-card px-4"
            >
              <Text className="font-pmedium text-sm text-white">Cancel</Text>
            </Pressable>
          </View>
        </SafeAreaView>
      </View>

      {/* Booking sheet */}
      <View style={{ height: SCREEN_H * 0.6 }} className="rounded-t-[28px] bg-card pt-3">
        <View className="mb-2 h-1 w-10 self-center rounded-full bg-hairline" />
        <ScrollView
          className="flex-1"
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
          contentContainerStyle={{ paddingHorizontal: 20, paddingBottom: 8 }}
        >
          {/* Standard mode: route + ride options + payment. Hidden in negotiate mode. */}
          {!negotiate ? (
            <>
          {/* Route summary */}
          <View className="rounded-input bg-surface p-4">
            <View className="flex-row items-center">
              <View className="h-2.5 w-2.5 rounded-full bg-brand" />
              <Text numberOfLines={1} className="ml-3 flex-1 font-sans text-sm text-white">
                {pickup.address ?? 'Current location'}
              </Text>
            </View>
            <View className="my-1.5 ml-1 h-3 w-px bg-hairline" />
            <View className="flex-row items-center">
              <Ionicons name="location" size={13} color={colors.danger} />
              <Text numberOfLines={1} className="ml-2 flex-1 font-sans text-sm text-white">
                {dropoff.address}
              </Text>
              <Pressable onPress={() => router.back()} hitSlop={8}>
                <Ionicons name="create-outline" size={18} color={colors.subtle} />
              </Pressable>
            </View>
          </View>

          {/* Solo / Carpool */}
          <View className="mt-3 flex-row gap-2">
            <Toggle label="Solo" active={rideType === 'solo'} onPress={() => setRideType('solo')} />
            <Toggle
              label="Carpool"
              active={rideType === 'carpool'}
              onPress={() => setRideType('carpool')}
            />
          </View>

          {/* Pick a ride */}
          <View className="mb-2 mt-4 flex-row items-center justify-between">
            <Text className="font-psemibold text-lg text-white">Pick a ride</Text>
            {quote ? (
              <View className="flex-row items-center">
                <Ionicons name="time-outline" size={14} color={colors.subtle} />
                <Text className="ml-1 font-sans text-sm text-subtle">
                  {formatTrip(quote.durationSeconds)} trip
                </Text>
              </View>
            ) : null}
          </View>

          {quoting ? (
            <View className="items-center py-10">
              <ActivityIndicator color={colors.brand} />
              <Text className="mt-3 font-sans text-sm text-subtle">Getting fares…</Text>
            </View>
          ) : (
            quote?.fares.map((f) => {
              const meta = CLASS_META[f.category] ?? { label: f.category, desc: '' };
              const active = category === f.category;
              return (
                <Pressable
                  key={f.category}
                  onPress={() => setCategory(f.category)}
                  className={`mb-3 flex-row items-center rounded-card border px-3 py-2.5 ${
                    active ? 'border-brand bg-brand/10' : 'border-hairline bg-surface'
                  }`}
                >
                  <Image source={CAR} resizeMode="contain" style={{ width: 76, height: 48 }} />
                  <View className="ml-3 flex-1">
                    <Text className="font-psemibold text-base text-white">{meta.label}</Text>
                    <Text className="font-sans text-xs text-subtle">{meta.desc}</Text>
                  </View>
                  <Text className="font-pbold text-base text-white">{naira(f.amount)}</Text>
                </Pressable>
              );
            })
          )}

          {/* Payment / carpool note */}
          {rideType === 'carpool' ? (
            <View className="mb-1 mt-1 flex-row items-start rounded-card bg-surface p-3">
              <Ionicons name="wallet-outline" size={16} color={colors.brand} />
              <Text className="ml-2 flex-1 font-sans text-xs text-muted">
                Each rider pays their share from their Kari wallet — invite friends after you start it
                to split the fare.
              </Text>
            </View>
          ) : (
            <>
              <Text className="mb-2 font-pmedium text-sm text-muted">Payment</Text>
              <View className="flex-row gap-2">
                {PAYMENTS.map((p) => {
                  const on = payment === p.value;
                  return (
                    <Pressable
                      key={p.value}
                      onPress={() => setPayment(p.value)}
                      className={`flex-row items-center rounded-pill border px-4 py-2 ${
                        on ? 'border-brand bg-brand' : 'border-hairline'
                      }`}
                    >
                      <Ionicons name={p.icon} size={15} color={on ? colors.bg : colors.muted} />
                      <Text
                        className={`ml-1.5 font-pmedium text-sm ${on ? 'text-bg' : 'text-muted'}`}
                      >
                        {p.label}
                      </Text>
                    </Pressable>
                  );
                })}
              </View>
              {payment === PaymentMethod.WALLET ? (
                <View className="mt-2 flex-row items-center justify-between rounded-card bg-surface px-3 py-2">
                  <Text className="font-sans text-xs text-muted">
                    Wallet balance: <Text className="text-white">{naira(wallet?.balance ?? 0)}</Text>
                  </Text>
                  {fare && (wallet?.balance ?? 0) < fare.amount ? (
                    <Pressable onPress={() => router.push('/wallet')} hitSlop={8}>
                      <Text className="font-pmedium text-xs text-brand">Top up</Text>
                    </Pressable>
                  ) : null}
                </View>
              ) : null}
            </>
          )}
            </>
          ) : null}

          {/* Negotiate toggle — solo + negotiable quotes; stays visible in both modes */}
          {rideType === 'solo' && quote?.negotiable ? (
            <View className={negotiate ? '' : 'mt-3'}>
              <Checkbox checked={negotiate} onChange={toggleNegotiate}>
                <Text className="font-sans text-muted">Negotiate the fare</Text>
              </Checkbox>
            </View>
          ) : null}

          {/* Negotiate mode: name your price */}
          {negotiate ? (
            <View className="mt-4">
              <View className="items-center rounded-card border border-hairline bg-surface px-5 py-6">
                <Text className="font-sans text-xs text-subtle">Your offer</Text>
                <View className="mt-2 flex-row items-center justify-center">
                  <Text className="font-pbold text-3xl text-white">₦</Text>
                  <TextInput
                    value={proposed}
                    onChangeText={(t) => setProposed(t.replace(/[^0-9]/g, ''))}
                    keyboardType="number-pad"
                    inputAccessoryViewID={inputAccessoryViewID}
                    selectionColor={colors.brand}
                    style={{
                      minWidth: 120,
                      textAlign: 'center',
                      color: '#ffffff',
                      fontSize: 34,
                      fontFamily: 'HankenGrotesk_700Bold',
                      paddingVertical: 2,
                    }}
                  />
                </View>
              </View>
              <View className="mt-3 flex-row gap-3">
                <Pressable
                  onPress={() => adjustOffer(-500)}
                  className="flex-1 items-center rounded-pill border border-brand bg-surface py-3"
                >
                  <Text className="font-psemibold text-base text-white">− ₦500</Text>
                </Pressable>
                <Pressable
                  onPress={() => adjustOffer(500)}
                  className="flex-1 items-center rounded-pill border border-brand bg-surface py-3"
                >
                  <Text className="font-psemibold text-base text-white">+ ₦500</Text>
                </Pressable>
              </View>
              <Text className="mt-3 text-center font-sans text-xs text-subtle">
                Drivers see your offer and can accept or counter it.
              </Text>
              {accessory}
            </View>
          ) : null}
        </ScrollView>

        {/* CTA */}
        <View className="px-5 pb-6 pt-2">
          <KariButton
            label={ctaLabel}
            onPress={request}
            loading={loading}
            disabled={quoting || !quote || (negotiate && Number(proposed) <= 0)}
          />
        </View>
      </View>
    </View>
  );
}

function Toggle({ label, active, onPress }: { label: string; active: boolean; onPress: () => void }) {
  return (
    <Pressable
      onPress={onPress}
      className={`flex-1 items-center rounded-pill border py-2.5 ${
        active ? 'border-brand bg-brand/10' : 'border-hairline bg-surface'
      }`}
    >
      <Text className={`font-pmedium text-sm ${active ? 'text-brand' : 'text-muted'}`}>{label}</Text>
    </Pressable>
  );
}
