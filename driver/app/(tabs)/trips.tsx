import { Ionicons } from '@expo/vector-icons';
import { useQuery } from '@tanstack/react-query';
import { ActivityIndicator, ScrollView, Text, View } from 'react-native';
import { RideStatus } from '@kari/types';
import { Screen, colors } from '@kari/mobile-core';
import { ridesApi } from '@/api/endpoints';

const naira = (n: number) => '₦' + Math.round(n).toString().replace(/\B(?=(\d{3})+(?!\d))/g, ',');

export default function Trips() {
  const { data: rides, isLoading } = useQuery({ queryKey: ['driver-trips'], queryFn: ridesApi.mine });
  const completed = (rides ?? []).filter((r) => r.status === RideStatus.COMPLETED);
  const earnings = completed.reduce((sum, r) => sum + (r.agreedPrice ?? r.quotedPrice ?? 0), 0);

  return (
    <Screen className="px-5">
      <Text className="mb-4 mt-2 font-pbold text-2xl text-white">Trips</Text>

      <View className="mb-5 flex-row gap-3">
        <View className="flex-1 rounded-card bg-card p-4">
          <Text className="font-sans text-xs text-subtle">Earnings</Text>
          <Text className="mt-1 font-pbold text-xl text-brand">{naira(earnings)}</Text>
        </View>
        <View className="flex-1 rounded-card bg-card p-4">
          <Text className="font-sans text-xs text-subtle">Completed</Text>
          <Text className="mt-1 font-pbold text-xl text-white">{completed.length}</Text>
        </View>
      </View>

      {isLoading ? (
        <ActivityIndicator color={colors.brand} />
      ) : completed.length === 0 ? (
        <View className="mt-16 items-center">
          <Ionicons name="car-outline" size={48} color={colors.subtle} />
          <Text className="mt-3 text-center font-sans text-muted">No completed trips yet.</Text>
        </View>
      ) : (
        <ScrollView showsVerticalScrollIndicator={false}>
          {completed.map((r) => (
            <View key={r.id} className="mb-3 flex-row items-center rounded-card bg-card p-4">
              <View className="h-10 w-10 items-center justify-center rounded-full bg-surface">
                <Ionicons name="checkmark" size={18} color={colors.success} />
              </View>
              <View className="ml-3 flex-1">
                <Text className="font-pmedium text-sm text-white" numberOfLines={1}>
                  {r.dropoffAddress ?? 'Trip'}
                </Text>
                <Text className="font-sans text-xs text-subtle">
                  {new Date(r.createdAt).toLocaleDateString()}
                </Text>
              </View>
              <Text className="font-psemibold text-brand">{naira(r.agreedPrice ?? r.quotedPrice)}</Text>
            </View>
          ))}
        </ScrollView>
      )}
    </Screen>
  );
}
