import { Ionicons } from '@expo/vector-icons';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useState } from 'react';
import { ActivityIndicator, Alert, ScrollView, Text, View } from 'react-native';
import { CarpoolStatus } from '@kari/types';
import { authApi, carpoolsApi } from '@/api/endpoints';
import { KariButton } from '@/components/KariButton';
import { Screen } from '@/components/Screen';
import { ScreenHeader } from '@/components/ScreenHeader';
import { errorMessage } from '@/lib/error';
import { colors } from '@/theme/tokens';

const naira = (n: number | null | undefined) =>
  n == null ? '—' : '₦' + Math.round(n).toString().replace(/\B(?=(\d{3})+(?!\d))/g, ',');
const TERMINAL: CarpoolStatus[] = [CarpoolStatus.COMPLETED, CarpoolStatus.CANCELLED];

export default function CarpoolScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const carpoolId = String(id);
  const router = useRouter();
  const qc = useQueryClient();
  const [busy, setBusy] = useState(false);

  const { data: me } = useQuery({ queryKey: ['auth-me'], queryFn: authApi.me });
  const { data: cp } = useQuery({
    queryKey: ['carpool', carpoolId],
    queryFn: () => carpoolsApi.get(carpoolId),
    refetchInterval: (q) => (q.state.data && TERMINAL.includes(q.state.data.status) ? false : 4000),
  });

  if (!cp) {
    return (
      <Screen className="items-center justify-center">
        <ActivityIndicator color={colors.brand} />
      </Screen>
    );
  }

  const mine = cp.members.find((m) => m.riderId === me?.id);
  const isCreator = cp.creatorId === me?.id;
  const canExit = [CarpoolStatus.OPEN, CarpoolStatus.MATCHED].includes(cp.status);

  const run = async (fn: () => Promise<unknown>, after?: () => void) => {
    setBusy(true);
    try {
      await fn();
      await qc.invalidateQueries({ queryKey: ['carpool', carpoolId] });
      await qc.invalidateQueries({ queryKey: ['carpools-mine'] });
      after?.();
    } catch (e) {
      Alert.alert('Something went wrong', errorMessage(e));
    } finally {
      setBusy(false);
    }
  };

  const leave = () =>
    Alert.alert('Leave carpool?', 'You can rejoin while there are open seats.', [
      { text: 'Stay', style: 'cancel' },
      { text: 'Leave', style: 'destructive', onPress: () => void run(() => carpoolsApi.leave(carpoolId), () => router.back()) },
    ]);
  const cancel = () =>
    Alert.alert('Cancel carpool?', 'This ends the carpool for everyone.', [
      { text: 'Keep it', style: 'cancel' },
      { text: 'Cancel carpool', style: 'destructive', onPress: () => void run(() => carpoolsApi.cancel(carpoolId), () => router.back()) },
    ]);

  const statusLine: Record<CarpoolStatus, string> = {
    [CarpoolStatus.OPEN]: 'Waiting for a driver · still gathering riders',
    [CarpoolStatus.MATCHED]: 'Driver assigned 🚗 — riders can still join',
    [CarpoolStatus.IN_PROGRESS]: 'On the way',
    [CarpoolStatus.COMPLETED]: `Trip complete · you paid ${naira(mine?.shareAmount)}`,
    [CarpoolStatus.CANCELLED]: 'Carpool cancelled',
  };

  return (
    <Screen className="px-5">
      <ScreenHeader title="Carpool" />
      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 32 }}>
        <Text className="mt-4 font-pmedium text-sm text-subtle">CARPOOL · {cp.status.replace('_', ' ')}</Text>
        <Text className="mt-1 font-psemibold text-lg text-white">{statusLine[cp.status]}</Text>

        {/* Route */}
        <View className="mt-4 rounded-card bg-card p-4">
          <View className="flex-row items-center">
            <View className="h-2.5 w-2.5 rounded-full bg-brand" />
            <Text numberOfLines={1} className="ml-3 flex-1 font-sans text-sm text-white">
              {cp.pickupAddress ?? 'Pickup'}
            </Text>
          </View>
          <View className="my-1 ml-1 h-4 w-px bg-hairline" />
          <View className="flex-row items-center">
            <Ionicons name="location" size={12} color={colors.brand} />
            <Text numberOfLines={1} className="ml-2 flex-1 font-sans text-sm text-white">
              {cp.dropoffAddress ?? 'Destination'}
            </Text>
          </View>
        </View>

        {/* Split */}
        <View className="mt-4 rounded-card bg-card p-4">
          <View className="flex-row justify-between">
            <Text className="font-sans text-muted">Your share</Text>
            <Text className="font-pbold text-lg text-brand">{naira(mine?.shareAmount)}</Text>
          </View>
          <View className="mt-1 flex-row justify-between">
            <Text className="font-sans text-muted">Whole trip</Text>
            <Text className="font-psemibold text-white">{naira(cp.totalFare)}</Text>
          </View>
          <View className="mt-1 flex-row justify-between">
            <Text className="font-sans text-muted">Seats filled</Text>
            <Text className="font-psemibold text-white">
              {cp.seatsTaken} / {cp.maxSeats}
            </Text>
          </View>
        </View>

        {/* Members */}
        <Text className="mb-2 mt-6 font-psemibold text-base text-white">Riders</Text>
        <View className="overflow-hidden rounded-card bg-card">
          {cp.members.map((m, i) => (
            <View
              key={m.riderId}
              className={`flex-row items-center px-4 py-3 ${i === cp.members.length - 1 ? '' : 'border-b border-hairline'}`}
            >
              <Ionicons name="person-circle-outline" size={22} color={colors.muted} />
              <Text className="ml-2 flex-1 font-pmedium text-sm text-white">
                {m.riderId === me?.id ? 'You' : 'Rider'}
                {m.isCreator ? ' · host' : ''}
              </Text>
              <Text className="font-psemibold text-sm text-muted">{naira(m.shareAmount)}</Text>
            </View>
          ))}
        </View>

        {/* Actions */}
        <View className="mt-8">
          {canExit ? (
            isCreator ? (
              <KariButton label="Cancel carpool" variant="outline" onPress={cancel} loading={busy} />
            ) : (
              <KariButton label="Leave carpool" variant="outline" onPress={leave} loading={busy} />
            )
          ) : (
            <KariButton label="Back home" onPress={() => router.replace('/(tabs)/home')} />
          )}
        </View>
      </ScrollView>
    </Screen>
  );
}
