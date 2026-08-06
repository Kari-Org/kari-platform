import { useRouter } from 'expo-router';
import { useEffect, useState } from 'react';
import { Alert, ScrollView, Text, View } from 'react-native';
import { useQueryClient } from '@tanstack/react-query';
import { ridesApi, subscriptionsApi } from '@/api/endpoints';
import { AddressAutocomplete } from '@/components/AddressAutocomplete';
import { InputField } from '@/components/InputField';
import { KariButton } from '@/components/KariButton';
import { Screen } from '@/components/Screen';
import { ScreenHeader } from '@/components/ScreenHeader';
import { errorMessage } from '@/lib/error';

const naira = (n: number) =>
  '₦' +
  Math.round(n)
    .toString()
    .replace(/\B(?=(\d{3})+(?!\d))/g, ',');

type Coords = { lat: number; lng: number };

/**
 * Route-priced subscription (spec 0004): pick your commute route, the server
 * prices the month from it. Frequency / trip-type settings arrive in a later
 * slice — nothing here may suggest settings the backend ignores.
 */
export default function NewSubscription() {
  const router = useRouter();
  const qc = useQueryClient();

  const [label, setLabel] = useState('');
  const [pickup, setPickup] = useState('');
  const [dropoff, setDropoff] = useState('');
  const [pickupCoords, setPickupCoords] = useState<Coords | null>(null);
  const [dropoffCoords, setDropoffCoords] = useState<Coords | null>(null);
  const [quoteRef, setQuoteRef] = useState<string | null>(null);
  const [fee, setFee] = useState<number | null>(null);
  const [soloFare, setSoloFare] = useState<number | null>(null);
  const [quoting, setQuoting] = useState(false);
  const [busy, setBusy] = useState(false);

  // Quote the route, then let the SERVER price the month (clients never compute money).
  useEffect(() => {
    if (!pickupCoords || !dropoffCoords) {
      setQuoteRef(null);
      setFee(null);
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
        const preview = await subscriptionsApi.preview(q.ref);
        if (!cancelled) {
          setQuoteRef(q.ref);
          setFee(preview.monthlyFeeNaira);
          setSoloFare(preview.soloFare);
        }
      } catch (e) {
        if (!cancelled) {
          setQuoteRef(null);
          setFee(null);
          Alert.alert('Could not price this route', errorMessage(e));
        }
      } finally {
        if (!cancelled) setQuoting(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [pickupCoords, dropoffCoords, pickup, dropoff]);

  const canCreate = !!(quoteRef && fee != null && label.trim() && !busy);

  const create = async () => {
    if (!canCreate || !quoteRef) return;
    setBusy(true);
    try {
      await subscriptionsApi.subscribe({ quoteRef, label: label.trim() });
      void qc.invalidateQueries({ queryKey: ['subscriptions-mine'] });
      Alert.alert('Subscribed', `“${label.trim()}” is active — rides on this route are covered.`);
      router.replace('/subscriptions');
    } catch (e) {
      Alert.alert('Could not subscribe', errorMessage(e));
    } finally {
      setBusy(false);
    }
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

        <Text className="mb-3 mt-6 font-psemibold text-base text-white">Your route</Text>
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

        {/* Pricing — server-computed */}
        <View className="mt-7 rounded-card border border-brand bg-brand/10 p-5">
          <Text className="font-psemibold text-base text-white">Monthly price</Text>
          {quoting ? (
            <Text className="mt-2 font-sans text-sm text-subtle">Pricing your route…</Text>
          ) : fee != null ? (
            <>
              <Text className="mt-2 font-pbold text-2xl text-brand">{naira(fee)}</Text>
              <Text className="mt-1 font-sans text-xs text-subtle">
                Solo fare on this route is {naira(soloFare ?? 0)} — your month covers unlimited
                trips on it, both directions, and rides cost nothing at pickup.
              </Text>
            </>
          ) : (
            <Text className="mt-2 font-sans text-xs text-subtle">
              Pick both addresses from the suggestions to price your month.
            </Text>
          )}
        </View>

        <View className="mt-6">
          <KariButton
            label={busy ? 'Subscribing…' : 'Subscribe'}
            onPress={() => void create()}
            disabled={!canCreate}
          />
        </View>
        <Text className="mt-3 text-center font-sans text-xs text-subtle">
          Charged once from your Kari wallet. Set days and times are coming soon.
        </Text>
      </ScrollView>
    </Screen>
  );
}
