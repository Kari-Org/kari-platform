import { Ionicons } from '@expo/vector-icons';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { ActivityIndicator, Pressable, ScrollView, Text, View } from 'react-native';
import { Screen, ScreenHeader, colors } from '@kari/mobile-core';
import { notificationsApi } from '@/api/endpoints';
import type { AppNotification } from '@/api/types';

const ICON: Record<string, keyof typeof Ionicons.glyphMap> = {
  panic: 'alert-circle-outline',
  ride: 'car-outline',
  carpool: 'people-outline',
  payment: 'wallet-outline',
  payout: 'arrow-up-circle-outline',
  referral: 'gift-outline',
};

export default function NotificationsScreen() {
  const qc = useQueryClient();
  const { data: items, isLoading } = useQuery({ queryKey: ['notifications'], queryFn: notificationsApi.list });

  const markRead = async (n: AppNotification) => {
    if (n.read) return;
    try {
      await notificationsApi.markRead(n.id);
      await qc.invalidateQueries({ queryKey: ['notifications'] });
    } catch {
      // ignore — non-critical
    }
  };

  return (
    <Screen className="px-5">
      <ScreenHeader title="Notifications" />
      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingVertical: 16 }}>
        {isLoading ? (
          <ActivityIndicator color={colors.brand} className="mt-6 self-center" />
        ) : !items || items.length === 0 ? (
          <Text className="mt-8 text-center font-sans text-sm text-subtle">You're all caught up.</Text>
        ) : (
          items.map((n) => (
            <Pressable
              key={n.id}
              onPress={() => void markRead(n)}
              className={`mb-2 flex-row rounded-card p-4 ${n.read ? 'bg-card' : 'bg-card border border-brand/40'}`}
            >
              <Ionicons name={ICON[n.type] ?? 'notifications-outline'} size={20} color={colors.brand} />
              <View className="ml-3 flex-1">
                <Text className="font-psemibold text-sm text-white">{n.title}</Text>
                <Text className="mt-0.5 font-sans text-xs text-muted">{n.body}</Text>
                <Text className="mt-1 font-sans text-[10px] text-subtle">
                  {new Date(n.createdAt).toLocaleString(undefined, { month: 'short', day: 'numeric', hour: 'numeric', minute: '2-digit' })}
                </Text>
              </View>
              {!n.read ? <View className="h-2 w-2 rounded-full bg-brand" /> : null}
            </Pressable>
          ))
        )}
      </ScrollView>
    </Screen>
  );
}
