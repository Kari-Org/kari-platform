import { Ionicons } from '@expo/vector-icons';
import { useQuery } from '@tanstack/react-query';
import { useState } from 'react';
import { ActivityIndicator, Pressable, ScrollView, Text, View } from 'react-native';
import { Screen, ScreenHeader, colors } from '@kari/mobile-core';
import { shuttleApi } from '@/api/endpoints';
import type { ShuttleTrip } from '@/api/types';

const time = (iso: string) =>
  new Date(iso).toLocaleTimeString(undefined, { hour: 'numeric', minute: '2-digit' });
const day = (iso: string) =>
  new Date(iso).toLocaleDateString(undefined, { weekday: 'short', month: 'short', day: 'numeric' });

export default function ShuttleScreen() {
  const [routeId, setRouteId] = useState<string | null>(null);

  const { data: routes } = useQuery({ queryKey: ['shuttle-routes'], queryFn: shuttleApi.routes });
  const { data: trips, isLoading } = useQuery({
    queryKey: ['shuttle-trips', routeId],
    queryFn: () => shuttleApi.trips(routeId ?? undefined),
  });

  return (
    <Screen className="px-5">
      <ScreenHeader title="Shuttle schedule" />
      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 32 }}>
        <Text className="mt-2 font-sans text-sm text-muted">
          Upcoming fixed-route shuttle trips and their live seat occupancy.
        </Text>

        {/* Route filter */}
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={{ gap: 8, paddingVertical: 16 }}
        >
          <FilterPill label="All routes" active={routeId === null} onPress={() => setRouteId(null)} />
          {(routes ?? []).map((r) => (
            <FilterPill key={r.id} label={r.name} active={routeId === r.id} onPress={() => setRouteId(r.id)} />
          ))}
        </ScrollView>

        {/* Trips */}
        {isLoading ? (
          <ActivityIndicator color={colors.brand} className="mt-6 self-center" />
        ) : !trips || trips.length === 0 ? (
          <View className="mt-10 items-center">
            <Ionicons name="bus-outline" size={48} color={colors.subtle} />
            <Text className="mt-3 text-center font-sans text-sm text-subtle">
              No upcoming trips scheduled{routeId ? ' on this route' : ''}.
            </Text>
          </View>
        ) : (
          trips.map((t) => <TripCard key={t.id} trip={t} />)
        )}
      </ScrollView>
    </Screen>
  );
}

function FilterPill({ label, active, onPress }: { label: string; active: boolean; onPress: () => void }) {
  return (
    <Pressable
      onPress={onPress}
      className={`rounded-pill border px-4 py-2 ${active ? 'border-brand bg-brand' : 'border-hairline'}`}
    >
      <Text className={`font-pmedium text-sm ${active ? 'text-bg' : 'text-muted'}`}>{label}</Text>
    </Pressable>
  );
}

function TripCard({ trip }: { trip: ShuttleTrip }) {
  const filled = trip.capacity > 0 ? Math.min(1, trip.seatsBooked / trip.capacity) : 0;
  const full = trip.seatsAvailable <= 0;
  return (
    <View className="mb-3 rounded-card bg-card p-4">
      <View className="flex-row items-center justify-between">
        <Text className="font-psemibold text-base text-white" numberOfLines={1}>
          {trip.routeName ?? 'Shuttle route'}
        </Text>
        <View className="flex-row items-center">
          <Ionicons name="time-outline" size={14} color={colors.brand} />
          <Text className="ml-1 font-pmedium text-sm text-brand">{time(trip.departAt)}</Text>
        </View>
      </View>
      <Text className="mt-0.5 font-sans text-xs text-subtle">{day(trip.departAt)}</Text>

      {/* Occupancy */}
      <View className="mt-3 h-2 overflow-hidden rounded-pill bg-surface">
        <View
          className={`h-2 rounded-pill ${full ? 'bg-danger' : 'bg-success'}`}
          style={{ width: `${Math.round(filled * 100)}%` }}
        />
      </View>
      <View className="mt-2 flex-row items-center justify-between">
        <Text className="font-sans text-xs text-muted">
          {trip.seatsBooked}/{trip.capacity} seats booked
        </Text>
        <Text className={`font-pmedium text-xs ${full ? 'text-danger' : 'text-success'}`}>
          {full ? 'Full' : `${trip.seatsAvailable} open`}
        </Text>
      </View>
    </View>
  );
}
