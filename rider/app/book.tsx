import { Ionicons } from '@expo/vector-icons';
import { useQuery } from '@tanstack/react-query';
import { useRouter } from 'expo-router';
import { type ComponentProps, useEffect, useState } from 'react';
import { Alert, KeyboardAvoidingView, Platform, Pressable, ScrollView, Text, View } from 'react-native';
import { CarCategory, KycStatus, PaymentMethod, PriceType } from '@kari/types';
import { carpoolsApi, ridersApi, ridesApi, walletApi } from '@/api/endpoints';
import type { Quote } from '@/api/types';
import { Checkbox } from '@/components/Checkbox';
import { InputField } from '@/components/InputField';
import { KariButton } from '@/components/KariButton';
import { Screen } from '@/components/Screen';
import { ScreenHeader } from '@/components/ScreenHeader';
import { errorMessage } from '@/lib/error';
import { useLocationStore } from '@/stores/location.store';
import { colors } from '@/theme/tokens';

type IconName = ComponentProps<typeof Ionicons>['name'];

const CLASS_META: Record<string, { label: string; icon: IconName; desc: string }> = {
  ECONOMY: { label: 'Economy', icon: 'car-outline', desc: 'Affordable everyday rides' },
  COMFORT: { label: 'Comfort', icon: 'car', desc: 'Newer cars, more legroom' },
  PREMIUM: { label: 'Premium', icon: 'car-sport', desc: 'Top-rated drivers, premium cars' },
};

const PAYMENTS = [
  { value: PaymentMethod.CASH, label: 'Cash' },
  { value: PaymentMethod.CARD, label: 'Card' },
  { value: PaymentMethod.WALLET, label: 'Wallet' },
];

const naira = (n: number) => '₦' + Math.round(n).toString().replace(/\B(?=(\d{3})+(?!\d))/g, ',');

const formatTrip = (seconds: number) => {
  const min = Math.max(1, Math.round(seconds / 60));
  if (min < 60) return `~${min} min trip`;
  const h = Math.floor(min / 60);
  const m = min % 60;
  return `~${h}h${m ? ` ${m}m` : ''} trip`;
};

export default function Book() {
  const router = useRouter();
  const { pickup, dropoff } = useLocationStore();
  const { data: wallet } = useQuery({ queryKey: ['wallet'], queryFn: walletApi.summary });
  const { data: profile } = useQuery({ queryKey: ['rider-me'], queryFn: ridersApi.me });
  const [step, setStep] = useState<'type' | 'class'>('type');
  const [rideType, setRideType] = useState<'solo' | 'carpool'>('solo');
  const [quote, setQuote] = useState<Quote | null>(null);
  const [category, setCategory] = useState<CarCategory>(CarCategory.ECONOMY);
  const [payment, setPayment] = useState<PaymentMethod>(PaymentMethod.CASH);
  const [negotiate, setNegotiate] = useState(false);
  const [proposed, setProposed] = useState('');
  const [loading, setLoading] = useState(false);

  // Redirect home if we somehow landed here without a booking context.
  // Do it in an effect — never navigate during render.
  useEffect(() => {
    if (!pickup || !dropoff) router.replace('/(tabs)/home');
  }, [pickup, dropoff, router]);
  if (!pickup || !dropoff) return null;

  const fare = quote?.fares.find((f) => f.category === category);

  const confirmType = async () => {
    setLoading(true);
    try {
      const q = await ridesApi.quote({
        pickupLat: pickup.lat,
        pickupLng: pickup.lng,
        pickupAddress: pickup.address,
        dropoffLat: dropoff.lat,
        dropoffLng: dropoff.lng,
        dropoffAddress: dropoff.address,
      });
      setQuote(q);
      setCategory(q.fares[0]?.category ?? CarCategory.ECONOMY);
      setStep('class');
    } catch (e) {
      Alert.alert('Could not get fare', errorMessage(e));
    } finally {
      setLoading(false);
    }
  };

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
      Alert.alert(
        'Verify your NIN',
        'Carpooling is NIN-gated so co-riders can trust each other.',
        [
          { text: 'Not now', style: 'cancel' },
          { text: 'Verify NIN', onPress: () => router.push('/verify-nin') },
        ],
      );
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

  return (
    <Screen className="px-5">
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        className="flex-1"
      >
      <ScreenHeader
        title="Book a ride"
        onBack={() => (step === 'class' ? setStep('type') : router.back())}
        right={
          <Pressable onPress={() => router.replace('/(tabs)/home')} hitSlop={8}>
            <Text className="font-pmedium text-sm text-brand">Cancel</Text>
          </Pressable>
        }
      />
      <View className="mt-4 rounded-card bg-card p-4">
        <View className="flex-row items-center">
          <View className="h-2.5 w-2.5 rounded-full bg-brand" />
          <Text numberOfLines={1} className="ml-3 flex-1 font-sans text-sm text-white">
            {pickup.address ?? 'Current location'}
          </Text>
        </View>
        <View className="my-1 ml-1 h-4 w-px bg-hairline" />
        <View className="flex-row items-center">
          <Ionicons name="location" size={12} color={colors.brand} />
          <Text numberOfLines={1} className="ml-2 flex-1 font-sans text-sm text-white">
            {dropoff.address}
          </Text>
        </View>
      </View>

      {step === 'type' ? (
        <View className="mt-8 flex-1">
          <Text className="mb-6 text-center font-psemibold text-xl text-white">
            Which would you prefer?
          </Text>
          <View className="flex-row gap-3">
            <TypeCard
              label="Solo Ride"
              icon="person"
              active={rideType === 'solo'}
              onPress={() => setRideType('solo')}
            />
            <TypeCard
              label="Carpooling"
              icon="people"
              active={rideType === 'carpool'}
              onPress={() => setRideType('carpool')}
            />
          </View>
          <View className="flex-1" />
          <View className="pb-8">
            <KariButton label="Confirm" onPress={confirmType} loading={loading} />
          </View>
        </View>
      ) : (
        <ScrollView showsVerticalScrollIndicator={false} className="mt-6 flex-1">
          <View className="mb-3 flex-row items-center justify-between">
            <Text className="font-psemibold text-lg text-white">Pick a ride</Text>
            {quote ? (
              <Text className="font-sans text-sm text-subtle">{formatTrip(quote.durationSeconds)}</Text>
            ) : null}
          </View>
          {quote?.fares.map((f) => {
            const meta = CLASS_META[f.category] ?? { label: f.category, icon: 'car' as IconName, desc: '' };
            const active = category === f.category;
            return (
              <Pressable
                key={f.category}
                onPress={() => setCategory(f.category)}
                className={`mb-3 flex-row items-center rounded-card border px-4 py-4 ${
                  active ? 'border-brand bg-brand/10' : 'border-hairline bg-card'
                }`}
              >
                <Ionicons name={meta.icon} size={28} color={active ? colors.brand : colors.muted} />
                <View className="ml-4 flex-1">
                  <Text className="font-psemibold text-base text-white">{meta.label}</Text>
                  <Text className="font-sans text-xs text-subtle">{meta.desc}</Text>
                </View>
                <Text className="font-pbold text-base text-white">{naira(f.amount)}</Text>
              </Pressable>
            );
          })}

          {rideType === 'carpool' ? (
            <View className="mb-2 mt-2 flex-row items-start rounded-card bg-card p-3">
              <Ionicons name="wallet-outline" size={16} color={colors.brand} />
              <Text className="ml-2 flex-1 font-sans text-xs text-muted">
                Each rider pays their share from their Kari wallet — invite friends after you start
                it to split the fare.
              </Text>
            </View>
          ) : (
            <>
              <Text className="mb-2 mt-2 font-pmedium text-sm text-muted">Payment</Text>
              <View className="mb-2 flex-row gap-2">
                {PAYMENTS.map((p) => (
                  <Pressable
                    key={p.value}
                    onPress={() => setPayment(p.value)}
                    className={`rounded-pill border px-4 py-2 ${
                      payment === p.value ? 'border-brand bg-brand' : 'border-hairline'
                    }`}
                  >
                    <Text
                      className={`font-pmedium text-sm ${payment === p.value ? 'text-bg' : 'text-muted'}`}
                    >
                      {p.label}
                    </Text>
                  </Pressable>
                ))}
              </View>
              {payment === PaymentMethod.WALLET ? (
                <View className="mb-2 flex-row items-center justify-between rounded-card bg-card px-3 py-2">
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

              {quote?.negotiable ? (
                <View className="mb-2 mt-2">
                  <Checkbox checked={negotiate} onChange={setNegotiate}>
                    <Text className="font-sans text-muted">Negotiate the fare</Text>
                  </Checkbox>
                </View>
              ) : null}
              {negotiate ? (
                <InputField
                  label="Your offer (₦)"
                  value={proposed}
                  onChangeText={setProposed}
                  keyboardType="number-pad"
                  placeholder={`e.g. ${Math.round((fare?.amount ?? 1000) * 0.8)}`}
                />
              ) : null}
            </>
          )}

          <View className="mb-8 mt-2">
            <KariButton
              label={
                rideType === 'carpool'
                  ? `Start carpool · ${naira(fare?.amount ?? 0)}`
                  : negotiate
                    ? `Request · offer ₦${proposed || '…'}`
                    : `Select ride · ${naira(fare?.amount ?? 0)}`
              }
              onPress={request}
              loading={loading}
              disabled={negotiate && !proposed}
            />
          </View>
        </ScrollView>
      )}
      </KeyboardAvoidingView>
    </Screen>
  );
}

function TypeCard({
  label,
  icon,
  active,
  onPress,
}: {
  label: string;
  icon: IconName;
  active: boolean;
  onPress: () => void;
}) {
  return (
    <Pressable
      onPress={onPress}
      className={`flex-1 items-center rounded-card border px-4 py-6 ${
        active ? 'border-brand bg-brand/10' : 'border-hairline bg-card'
      }`}
    >
      <Ionicons name={icon} size={28} color={active ? colors.brand : colors.muted} />
      <Text className="mt-2 font-pmedium text-white">{label}</Text>
    </Pressable>
  );
}
