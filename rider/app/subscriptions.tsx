import { Ionicons } from '@expo/vector-icons';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { useRouter } from 'expo-router';
import { useState } from 'react';
import { ActivityIndicator, Alert, ScrollView, Text, View } from 'react-native';
import { SubscriptionStatus } from '@kari/types';
import { subscriptionsApi } from '@/api/endpoints';
import type { Subscription, SubscriptionPlan } from '@/api/types';
import { KariButton } from '@/components/KariButton';
import { Screen } from '@/components/Screen';
import { ScreenHeader } from '@/components/ScreenHeader';
import { errorMessage } from '@/lib/error';
import { colors } from '@/theme/tokens';

const naira = (n: number) => '₦' + Math.round(n).toString().replace(/\B(?=(\d{3})+(?!\d))/g, ',');
const cycle = (days: number) => (days === 7 ? 'week' : days === 30 ? 'month' : `${days} days`);
const ridesLabel = (n: number | null) => (n == null ? 'Unlimited rides' : `${n} rides`);

export default function SubscriptionsScreen() {
  const qc = useQueryClient();
  const router = useRouter();
  const [busy, setBusy] = useState<string | null>(null);

  const { data: plans, isLoading } = useQuery({ queryKey: ['sub-plans'], queryFn: subscriptionsApi.plans });
  const { data: mine } = useQuery({ queryKey: ['sub-mine'], queryFn: subscriptionsApi.mine });
  const active = mine?.find((s) => s.status === SubscriptionStatus.ACTIVE) ?? null;

  const refetch = () =>
    Promise.all([
      qc.invalidateQueries({ queryKey: ['sub-mine'] }),
      qc.invalidateQueries({ queryKey: ['wallet'] }),
    ]);

  const subscribe = async (plan: SubscriptionPlan) => {
    setBusy(plan.id);
    try {
      await subscriptionsApi.subscribe(plan.id);
      await refetch();
      Alert.alert('Subscribed', `${plan.name} is now active — your dedicated driver will stick with you.`);
    } catch (e) {
      const msg = errorMessage(e);
      if (/top up|balance/i.test(msg)) {
        Alert.alert('Top up to subscribe', msg, [
          { text: 'Top up wallet', onPress: () => router.push('/wallet') },
          { text: 'Not now', style: 'cancel' },
        ]);
      } else {
        Alert.alert('Could not subscribe', msg);
      }
    } finally {
      setBusy(null);
    }
  };

  const cancel = (sub: Subscription) => {
    Alert.alert('Cancel subscription?', `End your ${sub.planName} plan?`, [
      { text: 'Keep it', style: 'cancel' },
      {
        text: 'Cancel plan',
        style: 'destructive',
        onPress: async () => {
          setBusy(sub.id);
          try {
            await subscriptionsApi.cancel(sub.id);
            await refetch();
          } catch (e) {
            Alert.alert('Could not cancel', errorMessage(e));
          } finally {
            setBusy(null);
          }
        },
      },
    ]);
  };

  return (
    <Screen className="px-5">
      <ScreenHeader title="Subscriptions" />
      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 32 }}>
        {/* Active subscription */}
        {active ? (
          <View className="mt-4 rounded-card border border-brand bg-brand/10 p-5">
            <View className="flex-row items-center justify-between">
              <Text className="font-psemibold text-lg text-white">{active.planName}</Text>
              <View className="rounded-pill bg-brand px-3 py-1">
                <Text className="font-pmedium text-xs text-bg">ACTIVE</Text>
              </View>
            </View>
            <Text className="mt-1 font-sans text-sm text-muted">
              Renews {new Date(active.currentPeriodEnd).toLocaleDateString(undefined, { month: 'short', day: 'numeric' })}
              {active.includedRides != null ? ` · ${active.ridesUsed}/${active.includedRides} rides used` : ' · unlimited rides'}
            </Text>
            <View className="mt-2 flex-row items-center">
              <Ionicons
                name={active.assignedDriverId ? 'person-circle' : 'person-circle-outline'}
                size={16}
                color={colors.brand}
              />
              <Text className="ml-1.5 font-sans text-xs text-subtle">
                {active.assignedDriverId ? 'Dedicated driver assigned' : 'Dedicated driver assigned on first ride'}
              </Text>
            </View>
            <View className="mt-4">
              <KariButton label="Cancel plan" variant="outline" onPress={() => cancel(active)} loading={busy === active.id} />
            </View>
          </View>
        ) : null}

        {/* Plans */}
        <Text className="mb-3 mt-6 font-psemibold text-lg text-white">
          {active ? 'Other plans' : 'Choose a plan'}
        </Text>
        {isLoading ? (
          <ActivityIndicator color={colors.brand} className="mt-4 self-start" />
        ) : (
          plans?.map((p) => (
            <View key={p.id} className="mb-3 rounded-card bg-card p-5">
              <View className="flex-row items-baseline justify-between">
                <Text className="font-psemibold text-base text-white">{p.name}</Text>
                <Text className="font-pbold text-lg text-brand">
                  {naira(p.priceNaira)}
                  <Text className="font-sans text-xs text-subtle"> /{cycle(p.billingCycleDays)}</Text>
                </Text>
              </View>
              <Text className="mt-1 font-sans text-sm text-muted">{p.description}</Text>
              <View className="mt-2 flex-row items-center">
                <Ionicons name="ticket-outline" size={14} color={colors.subtle} />
                <Text className="ml-1.5 font-sans text-xs text-subtle">{ridesLabel(p.includedRides)}</Text>
                {p.sameDriver ? (
                  <>
                    <Ionicons name="person-outline" size={14} color={colors.subtle} style={{ marginLeft: 12 }} />
                    <Text className="ml-1.5 font-sans text-xs text-subtle">Same driver</Text>
                  </>
                ) : null}
              </View>
              <View className="mt-4">
                <KariButton
                  label={active ? 'Switch (cancel current first)' : `Subscribe · ${naira(p.priceNaira)}`}
                  onPress={() => subscribe(p)}
                  loading={busy === p.id}
                  disabled={!!active}
                />
              </View>
            </View>
          ))
        )}
        <Text className="mt-2 font-sans text-xs text-subtle">
          Plan fees are charged from your Kari wallet.
        </Text>
      </ScrollView>
    </Screen>
  );
}
