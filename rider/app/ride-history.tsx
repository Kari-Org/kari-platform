import { Ionicons } from '@expo/vector-icons';
import { useQuery } from '@tanstack/react-query';
import { useRouter } from 'expo-router';
import { FlatList, Pressable, Text, View } from 'react-native';
import { RideStatus } from '@kari/types';
import { ridesApi } from '@/api/endpoints';
import type { Ride } from '@/api/types';
import { Screen } from '@/components/Screen';
import { colors } from '@/theme/tokens';

const naira = (n: number | null) =>
  n == null ? '—' : '₦' + Math.round(n).toString().replace(/\B(?=(\d{3})+(?!\d))/g, ',');

export default function RideHistory() {
  const router = useRouter();
  const { data, isLoading } = useQuery({ queryKey: ['my-rides'], queryFn: ridesApi.mine });
  const completed = (data ?? []).filter((r: Ride) => r.status === RideStatus.COMPLETED);

  return (
    <Screen className="px-5">
      <View className="mb-4 mt-4 flex-row items-center">
        <Pressable onPress={() => router.back()} className="mr-3">
          <Ionicons name="chevron-back" size={24} color={colors.text} />
        </Pressable>
        <Text className="font-pbold text-2xl text-white">My rides</Text>
      </View>
      <FlatList
        data={completed}
        keyExtractor={(r) => r.id}
        showsVerticalScrollIndicator={false}
        ListEmptyComponent={
          <Text className="mt-10 text-center font-sans text-muted">
            {isLoading ? 'Loading…' : 'No completed rides yet.'}
          </Text>
        }
        renderItem={({ item }: { item: Ride }) => (
          <Pressable
            onPress={() => router.push({ pathname: '/ride/[id]', params: { id: item.id } })}
            className="mb-3 rounded-card bg-card p-4"
          >
            <View className="flex-row items-center justify-between">
              <Text numberOfLines={1} className="flex-1 font-psemibold text-white">
                {item.dropoffAddress ?? 'Destination'}
              </Text>
              <Text className="ml-3 font-pbold text-white">
                {naira(item.agreedPrice ?? item.quotedPrice)}
              </Text>
            </View>
            <Text className="mt-1 font-sans text-xs text-subtle">
              {new Date(item.createdAt).toLocaleDateString()} ·{' '}
              {(item.distanceMeters / 1000).toFixed(1)} km
            </Text>
          </Pressable>
        )}
      />
    </Screen>
  );
}
