import { Ionicons } from '@expo/vector-icons';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { useRouter } from 'expo-router';
import type { ComponentProps } from 'react';
import { Alert, Pressable, ScrollView, Text, View } from 'react-native';
import type { Subscription } from '@/api/types';
import { subscriptionsApi } from '@/api/endpoints';
import { KariButton } from '@/components/KariButton';
import { Screen } from '@/components/Screen';
import { ScreenHeader } from '@/components/ScreenHeader';
import { errorMessage } from '@/lib/error';
import { colors } from '@/theme/tokens';

type IconName = ComponentProps<typeof Ionicons>['name'];
const naira = (n: number) =>
  '₦' +
  Math.round(n)
    .toString()
    .replace(/\B(?=(\d{3})+(?!\d))/g, ',');

export default function SubscriptionsScreen() {
  const router = useRouter();
  const qc = useQueryClient();
  const { data: subs } = useQuery({
    queryKey: ['subscriptions-mine'],
    queryFn: subscriptionsApi.mine,
  });

  const confirmCancel = (sub: Subscription) =>
    Alert.alert('Cancel subscription?', `End your “${sub.planName}” route subscription?`, [
      { text: 'Keep it', style: 'cancel' },
      {
        text: 'Cancel',
        style: 'destructive',
        onPress: () => {
          void subscriptionsApi
            .cancel(sub.id)
            .then(() => qc.invalidateQueries({ queryKey: ['subscriptions-mine'] }))
            .catch((e) => Alert.alert('Could not cancel', errorMessage(e)));
        },
      },
    ]);

  const list = subs ?? [];

  return (
    <Screen className="px-5">
      <ScreenHeader title="Subscription Routes" />
      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingBottom: 32 }}
      >
        <Text className="mt-2 font-sans text-sm text-muted">
          Lock in your commute route at a fixed monthly price — rides on it cost nothing at pickup.
        </Text>

        {list.length === 0 ? (
          <View className="mt-10 items-center">
            <Ionicons name="repeat" size={40} color={colors.subtle} />
            <Text className="mt-3 text-center font-sans text-sm text-subtle">
              No subscriptions yet. Set one up for your daily commute.
            </Text>
          </View>
        ) : (
          list.map((s) => (
            <View key={s.id} className="mt-4 rounded-card bg-card p-5">
              <View className="flex-row items-center justify-between">
                <Text className="font-psemibold text-base text-white">{s.planName}</Text>
                <View
                  className={`rounded-pill px-3 py-1 ${s.status === 'ACTIVE' ? 'bg-brand' : 'bg-card border border-hairline'}`}
                >
                  <Text
                    className={`font-pmedium text-xs ${s.status === 'ACTIVE' ? 'text-bg' : 'text-muted'}`}
                  >
                    {s.status}
                  </Text>
                </View>
              </View>

              {s.route ? (
                <View className="mt-3">
                  <Stop
                    icon="ellipse"
                    tint={colors.brand}
                    text={s.route.pickup.address ?? 'Pickup'}
                  />
                  <View className="ml-[6px] h-3 w-px bg-hairline" />
                  <Stop
                    icon="location"
                    tint={colors.danger}
                    text={s.route.dropoff.address ?? 'Dropoff'}
                  />
                </View>
              ) : null}

              <View className="mt-4 flex-row rounded-input bg-bg p-4">
                <View className="flex-1">
                  <Text className="font-sans text-xs text-subtle">Monthly</Text>
                  <Text className="mt-0.5 font-pbold text-lg text-brand">
                    {s.monthlyFeeNaira != null ? naira(s.monthlyFeeNaira) : '—'}
                  </Text>
                </View>
                <View className="w-px bg-hairline" />
                <View className="flex-1 pl-4">
                  <Text className="font-sans text-xs text-subtle">Rides used</Text>
                  <Text className="mt-0.5 font-pbold text-lg text-white">{s.ridesUsed}</Text>
                </View>
              </View>

              <View className="mt-3 flex-row items-center justify-between">
                <Text className="font-sans text-xs text-subtle">
                  Renews {new Date(s.currentPeriodEnd).toLocaleDateString()}
                </Text>
                {s.status === 'ACTIVE' ? (
                  <Pressable onPress={() => confirmCancel(s)}>
                    <Text className="font-pmedium text-xs text-danger">Cancel</Text>
                  </Pressable>
                ) : null}
              </View>
            </View>
          ))
        )}

        <View className="mt-6">
          <KariButton
            label="Create a subscription"
            onPress={() => router.push('/subscription-new')}
          />
        </View>
        <Text className="mt-3 text-center font-sans text-xs text-subtle">
          Subscriptions are billed from your Kari wallet.
        </Text>
      </ScrollView>
    </Screen>
  );
}

function Stop({ icon, tint, text }: { icon: IconName; tint: string; text: string }) {
  return (
    <View className="flex-row items-center">
      <Ionicons name={icon} size={13} color={tint} />
      <Text numberOfLines={1} className="ml-2.5 flex-1 font-sans text-sm text-white">
        {text}
      </Text>
    </View>
  );
}
