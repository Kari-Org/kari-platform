import { Ionicons } from '@expo/vector-icons';
import { useQuery } from '@tanstack/react-query';
import { useRouter } from 'expo-router';
import { type ComponentProps } from 'react';
import { Alert, Pressable, ScrollView, Text, View } from 'react-native';
import { authApi, ridersApi } from '@/api/endpoints';
import { Screen } from '@/components/Screen';
import { useAuthStore } from '@/stores/auth.store';
import { colors } from '@/theme/tokens';

type IconName = ComponentProps<typeof Ionicons>['name'];
type RowItem = { icon: IconName; label: string; onPress: () => void };

export default function Account() {
  const router = useRouter();
  const logout = useAuthStore((s) => s.logout);
  const { data: profile } = useQuery({ queryKey: ['rider-me'], queryFn: ridersApi.me });
  const { data: user } = useQuery({ queryKey: ['auth-me'], queryFn: authApi.me });
  const name = [profile?.firstName, profile?.lastName].filter(Boolean).join(' ') || 'Rider';

  const soon = (what: string) => Alert.alert('Coming soon', `${what} is coming in a later update.`);
  const confirmLogout = () =>
    Alert.alert('Log out?', 'You can always log back in.', [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Log out', style: 'destructive', onPress: () => void logout() },
    ]);

  const account: RowItem[] = [
    { icon: 'person-outline', label: 'Personal Information', onPress: () => router.push('/personal-info') },
    { icon: 'wallet-outline', label: 'Wallet', onPress: () => router.push('/wallet') },
    { icon: 'gift-outline', label: 'Rewards & referrals', onPress: () => router.push('/rewards') },
  ];
  const preferences: RowItem[] = [
    { icon: 'musical-notes-outline', label: 'Music', onPress: () => router.push('/music') },
    { icon: 'car-outline', label: 'Driver Type', onPress: () => router.push('/driver-type') },
    { icon: 'language-outline', label: 'Language Preference', onPress: () => router.push('/language') },
    { icon: 'notifications-outline', label: 'Notifications', onPress: () => router.push('/notifications') },
  ];
  const addresses: RowItem[] = [
    { icon: 'home-outline', label: 'Home address', onPress: () => router.push('/addresses') },
    { icon: 'briefcase-outline', label: 'Work address', onPress: () => router.push('/addresses') },
    { icon: 'add', label: 'Add New Address', onPress: () => router.push('/addresses') },
  ];
  const rides: RowItem[] = [
    { icon: 'receipt-outline', label: 'My rides', onPress: () => router.push('/ride-history') },
    { icon: 'repeat-outline', label: 'Subscriptions', onPress: () => router.push('/subscriptions') },
    { icon: 'people-outline', label: 'Carpools', onPress: () => router.push('/carpools') },
    { icon: 'bus-outline', label: 'Shuttle', onPress: () => router.push('/shuttle') },
  ];
  const safety: RowItem[] = [
    { icon: 'shield-checkmark-outline', label: 'Emergency Contacts', onPress: () => router.push('/safety') },
    { icon: 'mic-outline', label: 'Audio Recordings', onPress: () => soon('Audio recordings') },
    { icon: 'warning-outline', label: 'Report Driver', onPress: () => soon('Reporting a driver') },
  ];
  const support: RowItem[] = [
    { icon: 'help-buoy-outline', label: 'Help & support', onPress: () => router.push('/support') },
  ];
  const session: RowItem[] = [
    { icon: 'log-out-outline', label: 'Log Out', onPress: confirmLogout },
    { icon: 'trash-outline', label: 'Delete Account', onPress: () => soon('Account deletion') },
  ];

  return (
    <Screen className="px-5">
      <ScrollView
        className="flex-1"
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingTop: 8, paddingBottom: 24 }}
      >
        {/* Profile header */}
        <View className="mb-6 flex-row items-center">
          <View className="h-12 w-12 items-center justify-center rounded-full bg-card">
            <Ionicons name="person" size={24} color={colors.brand} />
          </View>
          <View className="ml-3">
            <Text className="font-psemibold text-lg text-white">{name}</Text>
            <View className="mt-0.5 flex-row items-center">
              <Ionicons name="star" size={13} color={colors.brand} />
              <Text className="ml-1 font-sans text-xs text-white">
                {(profile?.ratingAvg ?? 0).toFixed(1)}
              </Text>
            </View>
          </View>
        </View>

        <Group items={account} />
        <Section title="Preferences" items={preferences} />
        <Section title="Address Management" items={addresses} />
        <Section title="Rides" items={rides} />
        <Section title="Safety" items={safety} />
        <Section title="Support" items={support} />
        <Group items={session} />
      </ScrollView>
    </Screen>
  );
}

function Rows({ items }: { items: RowItem[] }) {
  return (
    <>
      {items.map((it, i) => (
        <Pressable
          key={it.label}
          onPress={it.onPress}
          className={`flex-row items-center px-4 py-4 ${
            i < items.length - 1 ? 'border-b border-hairline' : ''
          }`}
        >
          <Ionicons name={it.icon} size={22} color={colors.muted} />
          <Text className="ml-3 flex-1 font-pmedium text-base text-white">{it.label}</Text>
        </Pressable>
      ))}
    </>
  );
}

function Group({ items }: { items: RowItem[] }) {
  return (
    <View className="mb-5 overflow-hidden rounded-card bg-card">
      <Rows items={items} />
    </View>
  );
}

function Section({ title, items }: { title: string; items: RowItem[] }) {
  return (
    <View className="mb-5">
      <Text className="mb-2 font-pmedium text-[13px] text-brand">{title}</Text>
      <View className="overflow-hidden rounded-card bg-card">
        <Rows items={items} />
      </View>
    </View>
  );
}
