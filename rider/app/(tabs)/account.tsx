import { Ionicons } from '@expo/vector-icons';
import { useQuery } from '@tanstack/react-query';
import { useRouter } from 'expo-router';
import { type ComponentProps } from 'react';
import { Pressable, Text, View } from 'react-native';
import { authApi, ridersApi } from '@/api/endpoints';
import { KariButton } from '@/components/KariButton';
import { Screen } from '@/components/Screen';
import { useAuthStore } from '@/stores/auth.store';
import { colors } from '@/theme/tokens';

export default function Account() {
  const router = useRouter();
  const logout = useAuthStore((s) => s.logout);
  const { data: profile } = useQuery({ queryKey: ['rider-me'], queryFn: ridersApi.me });
  const { data: user } = useQuery({ queryKey: ['auth-me'], queryFn: authApi.me });
  const name = [profile?.firstName, profile?.lastName].filter(Boolean).join(' ') || 'Rider';

  return (
    <Screen className="px-5">
      <Text className="mb-6 mt-4 font-pbold text-2xl text-white">Account</Text>
      <View className="rounded-card bg-card p-5">
        <Text className="font-psemibold text-xl text-white">{name}</Text>
        {user?.email ? <Text className="mt-1 font-sans text-sm text-muted">{user.email}</Text> : null}
        {user?.phone ? <Text className="mt-1 font-sans text-sm text-muted">{user.phone}</Text> : null}
        <Text className="mt-3 font-pmedium text-sm text-brand">
          ★ {(profile?.ratingAvg ?? 0).toFixed(1)} rider rating
        </Text>
      </View>

      <View className="mt-5 overflow-hidden rounded-card bg-card">
        <Row icon="wallet-outline" label="Wallet" onPress={() => router.push('/wallet')} />
        <Row icon="gift-outline" label="Rewards & referrals" onPress={() => router.push('/rewards')} />
        <Row icon="repeat-outline" label="Subscriptions" onPress={() => router.push('/subscriptions')} />
        <Row icon="people-outline" label="Carpools" onPress={() => router.push('/carpools')} />
        <Row icon="bus-outline" label="Shuttle" onPress={() => router.push('/shuttle')} />
        <Row icon="receipt-outline" label="My rides" onPress={() => router.push('/ride-history')} />
      </View>

      <View className="mt-4 overflow-hidden rounded-card bg-card">
        <Row icon="notifications-outline" label="Notifications" onPress={() => router.push('/notifications')} />
        <Row icon="shield-checkmark-outline" label="Emergency contacts" onPress={() => router.push('/safety')} />
        <Row icon="help-buoy-outline" label="Help & support" onPress={() => router.push('/support')} />
      </View>

      <View className="flex-1" />
      <View className="pb-8">
        <KariButton label="Log out" variant="outline" onPress={() => void logout()} />
      </View>
    </Screen>
  );
}

function Row({
  icon,
  label,
  onPress,
}: {
  icon: ComponentProps<typeof Ionicons>['name'];
  label: string;
  onPress: () => void;
}) {
  return (
    <Pressable onPress={onPress} className="flex-row items-center px-4 py-4">
      <Ionicons name={icon} size={20} color={colors.muted} />
      <Text className="ml-3 flex-1 font-pmedium text-base text-white">{label}</Text>
      <Ionicons name="chevron-forward" size={18} color={colors.subtle} />
    </Pressable>
  );
}
