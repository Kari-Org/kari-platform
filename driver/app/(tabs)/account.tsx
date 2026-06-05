import { Ionicons } from '@expo/vector-icons';
import { useQuery } from '@tanstack/react-query';
import { useRouter } from 'expo-router';
import { type ReactNode } from 'react';
import { Pressable, ScrollView, Text, View } from 'react-native';
import { KycStatus } from '@kari/types';
import { KariButton, Screen, colors } from '@kari/mobile-core';
import { authApi, driversApi } from '@/api/endpoints';
import { useAuthStore } from '@/stores/auth.store';

const AVAIL: Record<string, { label: string; color: string }> = {
  ONLINE: { label: 'Online', color: colors.success },
  ON_TRIP: { label: 'On a trip', color: colors.brand },
  OFFLINE: { label: 'Offline', color: colors.subtle },
};

export default function Account() {
  const logout = useAuthStore((s) => s.logout);
  const router = useRouter();
  const { data: p } = useQuery({ queryKey: ['driver-me'], queryFn: driversApi.me });
  const { data: user } = useQuery({ queryKey: ['auth-me'], queryFn: authApi.me });

  const name = [p?.firstName, p?.lastName].filter(Boolean).join(' ') || 'Driver';
  const avail = AVAIL[p?.availability ?? 'OFFLINE'] ?? AVAIL.OFFLINE;
  const acct = p?.bankAccountNumber ? '••••' + p.bankAccountNumber.slice(-4) : '—';

  return (
    <Screen className="px-5">
      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 32 }}>
        <Text className="mb-5 mt-2 font-pbold text-2xl text-white">Account</Text>

        <View className="items-center rounded-card bg-card p-6">
          <View className="h-20 w-20 items-center justify-center rounded-full bg-surface">
            <Ionicons name="person" size={40} color={colors.brand} />
          </View>
          <Text className="mt-3 font-pbold text-xl text-white">{name}</Text>
          <View className="mt-1 flex-row items-center">
            <Text className="font-pmedium text-sm text-brand">★ {(p?.ratingAvg ?? 0).toFixed(1)}</Text>
            <Text className="ml-1 font-sans text-sm text-subtle">· {p?.ratingCount ?? 0} trips</Text>
          </View>
          <View className="mt-3 flex-row items-center rounded-pill bg-surface px-3 py-1.5">
            <View className="mr-2 h-2 w-2 rounded-full" style={{ backgroundColor: avail.color }} />
            <Text className="font-pmedium text-xs text-white">{avail.label}</Text>
          </View>
        </View>

        <View className="mt-4 overflow-hidden rounded-card bg-card px-4">
          <NavRow icon="cash-outline" label="Earnings & payouts" onPress={() => router.push('/earnings')} />
          <NavRow icon="trophy-outline" label="Rewards & referrals" onPress={() => router.push('/rewards')} last />
        </View>

        <Card title="Contact">
          <InfoRow icon="mail" label="Email" value={user?.email ?? '—'} />
          <InfoRow icon="call" label="Phone" value={user?.phone ?? '—'} last />
        </Card>

        {p?.vehicle ? (
          <Card title="Vehicle">
            <InfoRow
              icon="car"
              label="Car"
              value={[p.vehicle.color, p.vehicle.brand, p.vehicle.model].filter(Boolean).join(' ') || '—'}
            />
            <InfoRow icon="pricetag" label="Plate" value={p.vehicle.plateNumber} />
            <InfoRow icon="grid" label="Class" value={p.vehicle.category} last />
          </Card>
        ) : null}

        <Card title="Verification">
          <InfoRow
            icon="card"
            label="NIN"
            value={p?.nin ? '••••' + p.nin.slice(-4) : '—'}
            ok={p?.ninStatus === KycStatus.VERIFIED}
          />
          <InfoRow
            icon="happy"
            label="Liveness"
            value={p?.livenessVerified ? 'Verified' : 'Pending'}
            ok={!!p?.livenessVerified}
          />
          <InfoRow
            icon="checkmark-done"
            label="Onboarding"
            value={p?.onboardingComplete ? 'Complete' : 'Incomplete'}
            ok={!!p?.onboardingComplete}
            last
          />
        </Card>

        <Card title="Payout">
          <InfoRow icon="business" label="Bank" value={p?.bankName ?? '—'} />
          <InfoRow icon="wallet" label="Account" value={acct} />
          <InfoRow icon="person-circle" label="Account name" value={p?.bankAccountName ?? '—'} last />
        </Card>

        <View className="mt-6">
          <KariButton label="Log out" variant="outline" onPress={() => void logout()} />
        </View>
        <Text className="mt-4 text-center font-sans text-xs text-subtle">Kari Driver · v1.0.0 (dev)</Text>
      </ScrollView>
    </Screen>
  );
}

function Card({ title, children }: { title: string; children: ReactNode }) {
  return (
    <View className="mt-4">
      <Text className="mb-2 font-pmedium text-sm text-subtle">{title}</Text>
      <View className="rounded-card bg-card px-4">{children}</View>
    </View>
  );
}

function NavRow({
  icon,
  label,
  onPress,
  last,
}: {
  icon: keyof typeof Ionicons.glyphMap;
  label: string;
  onPress: () => void;
  last?: boolean;
}) {
  return (
    <Pressable
      onPress={onPress}
      className={`flex-row items-center py-3.5 ${last ? '' : 'border-b border-hairline'}`}
    >
      <Ionicons name={icon} size={18} color={colors.brand} />
      <Text className="ml-3 flex-1 font-pmedium text-sm text-white">{label}</Text>
      <Ionicons name="chevron-forward" size={16} color={colors.subtle} />
    </Pressable>
  );
}

function InfoRow({
  icon,
  label,
  value,
  ok,
  last,
}: {
  icon: keyof typeof Ionicons.glyphMap;
  label: string;
  value: string;
  ok?: boolean;
  last?: boolean;
}) {
  return (
    <View className={`flex-row items-center py-3 ${last ? '' : 'border-b border-hairline'}`}>
      <Ionicons name={icon} size={18} color={colors.subtle} />
      <Text className="ml-3 flex-1 font-sans text-sm text-muted">{label}</Text>
      <Text className="font-pmedium text-sm text-white" numberOfLines={1}>
        {value}
      </Text>
      {ok ? (
        <Ionicons name="checkmark-circle" size={16} color={colors.success} style={{ marginLeft: 6 }} />
      ) : null}
    </View>
  );
}
