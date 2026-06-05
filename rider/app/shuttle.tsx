import { Ionicons } from '@expo/vector-icons';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { useRouter } from 'expo-router';
import { useMemo, useState } from 'react';
import { ActivityIndicator, Alert, Pressable, ScrollView, Text, View } from 'react-native';
import { ShuttleBookingStatus } from '@kari/types';
import { shuttleApi } from '@/api/endpoints';
import type { ShuttleStop } from '@/api/types';
import { KariButton } from '@/components/KariButton';
import { Screen } from '@/components/Screen';
import { ScreenHeader } from '@/components/ScreenHeader';
import { errorMessage } from '@/lib/error';
import { colors } from '@/theme/tokens';

const naira = (n: number) => '₦' + Math.round(n).toString().replace(/\B(?=(\d{3})+(?!\d))/g, ',');
const when = (iso: string) =>
  new Date(iso).toLocaleString(undefined, { weekday: 'short', hour: 'numeric', minute: '2-digit' });

function StopChips({
  stops,
  selected,
  disabledBefore,
  onPick,
}: {
  stops: ShuttleStop[];
  selected: string | null;
  disabledBefore?: number;
  onPick: (id: string) => void;
}) {
  return (
    <View className="mt-1 flex-row flex-wrap gap-2">
      {stops.map((s) => {
        const disabled = disabledBefore != null && s.sequence <= disabledBefore;
        const active = selected === s.id;
        return (
          <Pressable
            key={s.id}
            disabled={disabled}
            onPress={() => onPick(s.id)}
            className={`rounded-pill border px-3 py-1.5 ${
              active ? 'border-brand bg-brand' : disabled ? 'border-hairline opacity-40' : 'border-hairline'
            }`}
          >
            <Text className={`font-pmedium text-xs ${active ? 'text-bg' : 'text-muted'}`}>{s.name}</Text>
          </Pressable>
        );
      })}
    </View>
  );
}

export default function ShuttleScreen() {
  const qc = useQueryClient();
  const router = useRouter();
  const [routeId, setRouteId] = useState<string | null>(null);
  const [fromId, setFromId] = useState<string | null>(null);
  const [toId, setToId] = useState<string | null>(null);
  const [tripId, setTripId] = useState<string | null>(null);
  const [seats, setSeats] = useState(1);
  const [busy, setBusy] = useState(false);

  const { data: routes, isLoading } = useQuery({ queryKey: ['shuttle-routes'], queryFn: shuttleApi.routes });
  const { data: trips } = useQuery({
    queryKey: ['shuttle-trips', routeId],
    queryFn: () => shuttleApi.trips(routeId!),
    enabled: !!routeId,
  });
  const { data: bookings } = useQuery({ queryKey: ['shuttle-bookings'], queryFn: shuttleApi.myBookings });

  const route = routes?.find((r) => r.id === routeId) ?? null;
  const from = route?.stops.find((s) => s.id === fromId) ?? null;
  const to = route?.stops.find((s) => s.id === toId) ?? null;
  const fare = useMemo(
    () => (from && to ? (to.fareFromOrigin - from.fareFromOrigin) * seats : 0),
    [from, to, seats],
  );
  const ready = !!routeId && !!from && !!to && fare > 0 && !!tripId;

  const pickRoute = (id: string) => {
    setRouteId(id);
    setFromId(null);
    setToId(null);
    setTripId(null);
  };

  const book = async () => {
    if (!ready) return;
    setBusy(true);
    try {
      await shuttleApi.book(tripId!, { fromStopId: fromId!, toStopId: toId!, seats });
      await Promise.all([
        qc.invalidateQueries({ queryKey: ['shuttle-bookings'] }),
        qc.invalidateQueries({ queryKey: ['shuttle-trips', routeId] }),
        qc.invalidateQueries({ queryKey: ['wallet'] }),
      ]);
      setFromId(null);
      setToId(null);
      setTripId(null);
      Alert.alert('Seat booked', `${route?.name}: ${from?.name} → ${to?.name} · ${naira(fare)}`);
    } catch (e) {
      const msg = errorMessage(e);
      if (/top up|balance/i.test(msg)) {
        Alert.alert('Top up to book', msg, [
          { text: 'Top up wallet', onPress: () => router.push('/wallet') },
          { text: 'Not now', style: 'cancel' },
        ]);
      } else {
        Alert.alert('Could not book', msg);
      }
    } finally {
      setBusy(false);
    }
  };

  const cancel = (id: string) =>
    Alert.alert('Cancel booking?', 'Your fare will be refunded to your wallet.', [
      { text: 'Keep it', style: 'cancel' },
      {
        text: 'Cancel',
        style: 'destructive',
        onPress: async () => {
          try {
            await shuttleApi.cancel(id);
            await Promise.all([
              qc.invalidateQueries({ queryKey: ['shuttle-bookings'] }),
              qc.invalidateQueries({ queryKey: ['wallet'] }),
            ]);
          } catch (e) {
            Alert.alert('Could not cancel', errorMessage(e));
          }
        },
      },
    ]);

  return (
    <Screen className="px-5">
      <ScreenHeader title="Shuttle" />
      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 32 }}>
        <Text className="mb-2 mt-4 font-psemibold text-base text-white">Route</Text>
        {isLoading ? (
          <ActivityIndicator color={colors.brand} className="self-start" />
        ) : (
          <View className="flex-row flex-wrap gap-2">
            {routes?.map((r) => {
              const active = routeId === r.id;
              return (
                <Pressable
                  key={r.id}
                  onPress={() => pickRoute(r.id)}
                  className={`rounded-pill border px-4 py-2 ${active ? 'border-brand bg-brand' : 'border-hairline'}`}
                >
                  <Text className={`font-pmedium text-sm ${active ? 'text-bg' : 'text-muted'}`}>{r.name}</Text>
                </Pressable>
              );
            })}
          </View>
        )}

        {route ? (
          <>
            <Text className="mb-1 mt-5 font-pmedium text-sm text-muted">Board at</Text>
            <StopChips stops={route.stops} selected={fromId} onPick={(id) => { setFromId(id); if (toId) setToId(null); }} />

            <Text className="mb-1 mt-4 font-pmedium text-sm text-muted">Get off at</Text>
            <StopChips
              stops={route.stops}
              selected={toId}
              disabledBefore={from?.sequence}
              onPick={setToId}
            />

            <View className="mt-4 flex-row items-center justify-between">
              <Text className="font-pmedium text-sm text-muted">Seats</Text>
              <View className="flex-row items-center gap-4">
                <Pressable onPress={() => setSeats((s) => Math.max(1, s - 1))} hitSlop={8}>
                  <Ionicons name="remove-circle-outline" size={26} color={colors.muted} />
                </Pressable>
                <Text className="w-6 text-center font-psemibold text-base text-white">{seats}</Text>
                <Pressable onPress={() => setSeats((s) => Math.min(10, s + 1))} hitSlop={8}>
                  <Ionicons name="add-circle-outline" size={26} color={colors.brand} />
                </Pressable>
              </View>
            </View>

            <Text className="mb-1 mt-5 font-pmedium text-sm text-muted">Departure</Text>
            {!trips || trips.length === 0 ? (
              <Text className="font-sans text-sm text-subtle">No upcoming trips on this route.</Text>
            ) : (
              trips.map((t) => {
                const active = tripId === t.id;
                return (
                  <Pressable
                    key={t.id}
                    onPress={() => setTripId(t.id)}
                    className={`mb-2 flex-row items-center justify-between rounded-card border px-4 py-3 ${
                      active ? 'border-brand bg-brand/10' : 'border-hairline bg-card'
                    }`}
                  >
                    <Text className="font-pmedium text-sm text-white">{when(t.departAt)}</Text>
                    <Text className="font-sans text-xs text-subtle">{t.seatsAvailable} seats left</Text>
                  </Pressable>
                );
              })
            )}

            <View className="mt-4">
              <KariButton
                label={fare > 0 ? `Book seat · ${naira(fare)}` : 'Book seat'}
                onPress={book}
                loading={busy}
                disabled={!ready}
              />
            </View>
          </>
        ) : null}

        {/* My bookings */}
        <Text className="mb-2 mt-8 font-psemibold text-base text-white">My bookings</Text>
        {!bookings || bookings.length === 0 ? (
          <Text className="font-sans text-sm text-subtle">No shuttle bookings yet.</Text>
        ) : (
          bookings.map((b) => (
            <View key={b.id} className="mb-2 flex-row items-center rounded-card bg-card px-4 py-3">
              <Ionicons name="bus-outline" size={20} color={colors.brand} />
              <View className="ml-3 flex-1">
                <Text className="font-pmedium text-sm text-white">
                  {b.from} → {b.to}
                </Text>
                <Text className="font-sans text-xs text-subtle">
                  {b.seats} seat{b.seats === 1 ? '' : 's'} · {naira(b.fare)} · {b.status}
                </Text>
              </View>
              {b.status === ShuttleBookingStatus.CONFIRMED ? (
                <Pressable onPress={() => cancel(b.id)} hitSlop={6}>
                  <Text className="font-pmedium text-xs text-danger">Cancel</Text>
                </Pressable>
              ) : null}
            </View>
          ))
        )}
      </ScrollView>
    </Screen>
  );
}
