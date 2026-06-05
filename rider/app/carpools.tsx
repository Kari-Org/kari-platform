import { Ionicons } from '@expo/vector-icons';
import { useQuery } from '@tanstack/react-query';
import { useRouter } from 'expo-router';
import { useState } from 'react';
import { Alert, Pressable, ScrollView, Text, View } from 'react-native';
import { CarpoolStatus, KycStatus } from '@kari/types';
import { carpoolsApi, ridersApi } from '@/api/endpoints';
import { Screen } from '@/components/Screen';
import { ScreenHeader } from '@/components/ScreenHeader';
import { errorMessage } from '@/lib/error';
import { useLocationStore } from '@/stores/location.store';
import { colors } from '@/theme/tokens';

const naira = (n: number) => '₦' + Math.round(n).toString().replace(/\B(?=(\d{3})+(?!\d))/g, ',');
const LIVE: CarpoolStatus[] = [CarpoolStatus.OPEN, CarpoolStatus.MATCHED, CarpoolStatus.IN_PROGRESS];

export default function CarpoolsScreen() {
  const router = useRouter();
  const current = useLocationStore((s) => s.current);
  const [busy, setBusy] = useState<string | null>(null);

  const { data: profile } = useQuery({ queryKey: ['rider-me'], queryFn: ridersApi.me });
  const verified = profile?.ninStatus === KycStatus.VERIFIED;
  const { data: mine } = useQuery({ queryKey: ['carpools-mine'], queryFn: carpoolsApi.mine });
  const active = mine?.find((c) => LIVE.includes(c.status));
  const { data: nearby } = useQuery({
    queryKey: ['carpools-nearby', current?.lat, current?.lng],
    queryFn: () => carpoolsApi.joinable(current!.lat, current!.lng),
    enabled: !!current && verified,
  });

  const join = async (id: string) => {
    setBusy(id);
    try {
      await carpoolsApi.join(id);
      router.push({ pathname: '/carpool/[id]', params: { id } });
    } catch (e) {
      const msg = errorMessage(e);
      if (/NIN/i.test(msg)) router.push('/verify-nin');
      else Alert.alert('Could not join', msg);
    } finally {
      setBusy(null);
    }
  };

  return (
    <Screen className="px-5">
      <ScreenHeader title="Carpools" />
      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 32 }}>
        {!verified ? (
          <Pressable
            onPress={() => router.push('/verify-nin')}
            className="mt-4 flex-row items-center rounded-card border border-brand bg-brand/10 p-4"
          >
            <Ionicons name="shield-checkmark-outline" size={20} color={colors.brand} />
            <Text className="ml-3 flex-1 font-pmedium text-sm text-white">
              Verify your NIN to start or join carpools
            </Text>
            <Ionicons name="chevron-forward" size={18} color={colors.brand} />
          </Pressable>
        ) : null}

        {active ? (
          <>
            <Text className="mb-2 mt-6 font-psemibold text-base text-white">Your carpool</Text>
            <Pressable
              onPress={() => router.push({ pathname: '/carpool/[id]', params: { id: active.id } })}
              className="flex-row items-center rounded-card bg-card p-4"
            >
              <Ionicons name="people" size={22} color={colors.brand} />
              <View className="ml-3 flex-1">
                <Text className="font-pmedium text-sm text-white" numberOfLines={1}>
                  {active.dropoffAddress ?? 'Carpool'}
                </Text>
                <Text className="font-sans text-xs text-subtle">
                  {active.status.replace('_', ' ')} · {active.seatsTaken}/{active.maxSeats} seats · your share {naira(
                    active.members.find((m) => m.isCreator && m.riderId === active.creatorId)?.shareAmount ?? Math.round(active.totalFare / Math.max(active.seatsTaken, 1)),
                  )}
                </Text>
              </View>
              <Ionicons name="chevron-forward" size={18} color={colors.subtle} />
            </Pressable>
          </>
        ) : null}

        <Text className="mb-2 mt-6 font-psemibold text-base text-white">Carpools near you</Text>
        {!current ? (
          <Text className="font-sans text-sm text-subtle">Set your location on Home to find nearby carpools.</Text>
        ) : !verified ? (
          <Text className="font-sans text-sm text-subtle">Verify your NIN to see joinable carpools.</Text>
        ) : !nearby || nearby.length === 0 ? (
          <Text className="font-sans text-sm text-subtle">No open carpools nearby right now.</Text>
        ) : (
          nearby.map((c) => (
            <View key={c.id} className="mb-3 rounded-card bg-card p-4">
              <Text className="font-pmedium text-sm text-white" numberOfLines={1}>
                → {c.dropoffAddress ?? 'Destination'}
              </Text>
              <Text className="mt-0.5 font-sans text-xs text-subtle">
                {c.seatsAvailable} seat{c.seatsAvailable === 1 ? '' : 's'} left · ~{naira(Math.round(c.totalFare / (c.seatsTaken + 1)))} each
              </Text>
              <View className="mt-3 self-start">
                <Pressable
                  onPress={() => join(c.id)}
                  disabled={busy === c.id}
                  className="rounded-pill bg-brand px-5 py-2"
                >
                  <Text className="font-psemibold text-sm text-bg">{busy === c.id ? 'Joining…' : 'Join'}</Text>
                </Pressable>
              </View>
            </View>
          ))
        )}

        <Text className="mt-6 font-sans text-xs text-subtle">
          To start your own carpool, choose “Carpooling” when booking a ride.
        </Text>
      </ScrollView>
    </Screen>
  );
}
