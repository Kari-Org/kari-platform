import { useRouter } from 'expo-router';
import { useEffect, useMemo, useState } from 'react';
import { Alert, Pressable, ScrollView, Text, View } from 'react-native';
import { ridesApi } from '@/api/endpoints';
import { AddressAutocomplete } from '@/components/AddressAutocomplete';
import { InputField } from '@/components/InputField';
import { KariButton } from '@/components/KariButton';
import { Screen } from '@/components/Screen';
import { ScreenHeader } from '@/components/ScreenHeader';
import {
  type CommuteSubscription,
  formatTime12,
  naira,
  priceSubscription,
  TIME_SLOTS,
  type TripType,
  type Weekday,
  WEEKDAYS,
} from '@/lib/subscription';
import { useSubscriptions } from '@/stores/subscription.store';

type Coords = { lat: number; lng: number };
const FALLBACK_PER_TRIP = 1500; // used until both addresses are geocoded

export default function NewSubscription() {
  const router = useRouter();
  const add = useSubscriptions((s) => s.add);

  const [label, setLabel] = useState('');
  const [pickup, setPickup] = useState('');
  const [dropoff, setDropoff] = useState('');
  const [pickupCoords, setPickupCoords] = useState<Coords | null>(null);
  const [dropoffCoords, setDropoffCoords] = useState<Coords | null>(null);
  const [tripType, setTripType] = useState<TripType>('roundtrip');
  const [days, setDays] = useState<Weekday[]>(['Mon', 'Tue', 'Wed', 'Thu', 'Fri']);
  const [pickupTime, setPickupTime] = useState('07:00');
  const [returnTime, setReturnTime] = useState('17:30');
  const [perTrip, setPerTrip] = useState<number | null>(null);
  const [quoting, setQuoting] = useState(false);

  // Live per-trip fare estimate once both ends are geocoded.
  useEffect(() => {
    if (!pickupCoords || !dropoffCoords) {
      setPerTrip(null);
      return;
    }
    let cancelled = false;
    setQuoting(true);
    void (async () => {
      try {
        const q = await ridesApi.quote({
          pickupLat: pickupCoords.lat,
          pickupLng: pickupCoords.lng,
          pickupAddress: pickup,
          dropoffLat: dropoffCoords.lat,
          dropoffLng: dropoffCoords.lng,
          dropoffAddress: dropoff,
        });
        const cheapest = q.fares.length
          ? Math.min(...q.fares.map((f) => f.amount))
          : FALLBACK_PER_TRIP;
        if (!cancelled) setPerTrip(cheapest);
      } catch {
        if (!cancelled) setPerTrip(FALLBACK_PER_TRIP);
      } finally {
        if (!cancelled) setQuoting(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [pickupCoords, dropoffCoords, pickup, dropoff]);

  const toggleDay = (d: Weekday) =>
    setDays((prev) => (prev.includes(d) ? prev.filter((x) => x !== d) : [...prev, d]));

  const effectivePerTrip = perTrip ?? FALLBACK_PER_TRIP;
  const pricing = useMemo(
    () => priceSubscription(effectivePerTrip, days.length, tripType),
    [effectivePerTrip, days.length, tripType],
  );

  const canCreate = !!(pickup.trim() && dropoff.trim() && label.trim() && days.length > 0);

  const create = () => {
    if (!canCreate) return;
    const sub: CommuteSubscription = {
      id: `sub_${Date.now()}`,
      label: label.trim(),
      pickupAddress: pickup.trim(),
      dropoffAddress: dropoff.trim(),
      tripType,
      days,
      pickupTime,
      returnTime: tripType === 'roundtrip' ? returnTime : undefined,
      perTripNaira: effectivePerTrip,
      weeklyNaira: pricing.weekly,
      monthlyNaira: pricing.monthly,
      status: 'active',
      renewsInDays: 7,
    };
    add(sub);
    Alert.alert('Subscription created', `“${sub.label}” is now active.`);
    router.replace('/subscriptions');
  };

  return (
    <Screen className="px-5">
      <ScreenHeader title="New Subscription" />
      <ScrollView
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
        contentContainerStyle={{ paddingBottom: 40 }}
      >
        <View className="mt-2">
          <InputField
            label="Name this route"
            value={label}
            onChangeText={setLabel}
            placeholder="e.g. Home – Work"
          />
        </View>

        {/* 1. Route */}
        <SectionTitle n={1} text="Route" />
        <AddressAutocomplete
          label="Pickup"
          placeholder="Pickup address"
          value={pickup}
          onChangeText={(t) => {
            setPickup(t);
            setPickupCoords(null);
          }}
          onSelect={(p) => {
            setPickup(p.description);
            setPickupCoords({ lat: p.lat, lng: p.lng });
          }}
        />
        <AddressAutocomplete
          label="Dropoff"
          placeholder="Dropoff address"
          value={dropoff}
          onChangeText={(t) => {
            setDropoff(t);
            setDropoffCoords(null);
          }}
          onSelect={(p) => {
            setDropoff(p.description);
            setDropoffCoords({ lat: p.lat, lng: p.lng });
          }}
        />

        {/* 2. Trip type */}
        <SectionTitle n={2} text="Trip type" />
        <View className="flex-row gap-3">
          <Segment
            label="Round trip"
            sub="There & back"
            active={tripType === 'roundtrip'}
            onPress={() => setTripType('roundtrip')}
          />
          <Segment
            label="One-way"
            sub="Single direction"
            active={tripType === 'oneway'}
            onPress={() => setTripType('oneway')}
          />
        </View>

        {/* 3. Days */}
        <SectionTitle n={3} text="Days of the week" />
        <View className="flex-row justify-between">
          {WEEKDAYS.map((d) => {
            const on = days.includes(d);
            return (
              <Pressable
                key={d}
                onPress={() => toggleDay(d)}
                className={`h-11 w-11 items-center justify-center rounded-full ${
                  on ? 'bg-brand' : 'border border-hairline bg-card'
                }`}
              >
                <Text className={`font-pmedium text-xs ${on ? 'text-bg' : 'text-muted'}`}>{d[0]}</Text>
              </Pressable>
            );
          })}
        </View>

        {/* 4. Pickup time */}
        <SectionTitle n={4} text="Pickup time" />
        <TimeChips value={pickupTime} onChange={setPickupTime} />

        {/* 5. Return time (round trip) */}
        {tripType === 'roundtrip' ? (
          <>
            <SectionTitle n={5} text="Return time" />
            <TimeChips value={returnTime} onChange={setReturnTime} />
          </>
        ) : null}

        {/* Pricing summary */}
        <View className="mt-7 rounded-card border border-brand bg-brand/10 p-5">
          <Text className="font-psemibold text-base text-white">Estimated price</Text>
          <SummaryRow label="Per trip" value={quoting ? 'Calculating…' : naira(effectivePerTrip)} />
          <SummaryRow label="Trips / week" value={`${pricing.tripsPerWeek}`} />
          <View className="my-3 h-px bg-hairline" />
          <SummaryRow label="Weekly" value={naira(pricing.weekly)} big />
          <SummaryRow label="Monthly (save 10%)" value={naira(pricing.monthly)} big brand />
          {perTrip == null && !quoting ? (
            <Text className="mt-3 font-sans text-xs text-subtle">
              Pick both addresses from the suggestions for an exact fare — showing an estimate for now.
            </Text>
          ) : null}
        </View>

        <View className="mt-6">
          <KariButton label="Create subscription" onPress={create} disabled={!canCreate} />
        </View>
      </ScrollView>
    </Screen>
  );
}

function SectionTitle({ n, text }: { n: number; text: string }) {
  return (
    <View className="mb-3 mt-6 flex-row items-center">
      <View className="mr-2 h-5 w-5 items-center justify-center rounded-full bg-brand">
        <Text className="font-pbold text-[10px] text-bg">{n}</Text>
      </View>
      <Text className="font-psemibold text-base text-white">{text}</Text>
    </View>
  );
}

function Segment({
  label,
  sub,
  active,
  onPress,
}: {
  label: string;
  sub: string;
  active: boolean;
  onPress: () => void;
}) {
  return (
    <Pressable
      onPress={onPress}
      className={`flex-1 rounded-card border p-4 ${
        active ? 'border-brand bg-brand/10' : 'border-hairline bg-card'
      }`}
    >
      <Text className={`font-psemibold text-sm ${active ? 'text-white' : 'text-muted'}`}>{label}</Text>
      <Text className="mt-0.5 font-sans text-xs text-subtle">{sub}</Text>
    </Pressable>
  );
}

function TimeChips({ value, onChange }: { value: string; onChange: (t: string) => void }) {
  return (
    <ScrollView horizontal showsHorizontalScrollIndicator={false} className="-mx-5 px-5">
      <View className="flex-row gap-2">
        {TIME_SLOTS.map((t) => {
          const on = t === value;
          return (
            <Pressable
              key={t}
              onPress={() => onChange(t)}
              className={`rounded-pill px-4 py-2 ${on ? 'bg-brand' : 'border border-hairline bg-card'}`}
            >
              <Text className={`font-pmedium text-xs ${on ? 'text-bg' : 'text-muted'}`}>
                {formatTime12(t)}
              </Text>
            </Pressable>
          );
        })}
      </View>
    </ScrollView>
  );
}

function SummaryRow({
  label,
  value,
  big,
  brand,
}: {
  label: string;
  value: string;
  big?: boolean;
  brand?: boolean;
}) {
  return (
    <View className="mt-2 flex-row items-center justify-between">
      <Text className={big ? 'font-sans text-sm text-white' : 'font-sans text-xs text-muted'}>
        {label}
      </Text>
      <Text
        className={`font-pbold ${big ? 'text-base' : 'text-sm'} ${brand ? 'text-brand' : 'text-white'}`}
      >
        {value}
      </Text>
    </View>
  );
}
