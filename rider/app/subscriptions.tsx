import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import type { ComponentProps } from 'react';
import { Alert, Pressable, ScrollView, Text, View } from 'react-native';
import { KariButton } from '@/components/KariButton';
import { Screen } from '@/components/Screen';
import { ScreenHeader } from '@/components/ScreenHeader';
import { type CommuteSubscription, daysSummary, formatTime12, naira } from '@/lib/subscription';
import { useSubscriptions } from '@/stores/subscription.store';
import { colors } from '@/theme/tokens';

type IconName = ComponentProps<typeof Ionicons>['name'];

export default function SubscriptionsScreen() {
  const router = useRouter();
  const subs = useSubscriptions((s) => s.subscriptions);
  const cancel = useSubscriptions((s) => s.cancel);

  const confirmCancel = (sub: CommuteSubscription) =>
    Alert.alert('Cancel subscription?', `End your “${sub.label}” route subscription?`, [
      { text: 'Keep it', style: 'cancel' },
      { text: 'Cancel', style: 'destructive', onPress: () => cancel(sub.id) },
    ]);

  return (
    <Screen className="px-5">
      <ScreenHeader title="Subscription Routes" />
      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 32 }}>
        <Text className="mt-2 font-sans text-sm text-muted">
          Lock in a recurring route and ride at a fixed weekly or monthly price — guaranteed pickups on
          your schedule.
        </Text>

        {subs.length === 0 ? (
          <View className="mt-10 items-center">
            <Ionicons name="repeat" size={40} color={colors.subtle} />
            <Text className="mt-3 text-center font-sans text-sm text-subtle">
              No subscriptions yet. Set one up for your daily commute.
            </Text>
          </View>
        ) : (
          subs.map((s) => (
            <View key={s.id} className="mt-4 rounded-card bg-card p-5">
              <View className="flex-row items-center justify-between">
                <Text className="font-psemibold text-base text-white">{s.label}</Text>
                <View className="rounded-pill bg-brand px-3 py-1">
                  <Text className="font-pmedium text-xs text-bg">
                    {s.status === 'active' ? 'ACTIVE' : 'PAUSED'}
                  </Text>
                </View>
              </View>

              {/* Route */}
              <View className="mt-3">
                <Stop icon="ellipse" tint={colors.brand} text={s.pickupAddress} />
                <View className="ml-[6px] h-3 w-px bg-hairline" />
                <Stop icon="location" tint={colors.danger} text={s.dropoffAddress} />
              </View>

              {/* Schedule */}
              <View className="mt-4 flex-row flex-wrap gap-x-4 gap-y-1.5">
                <Meta icon="calendar-outline" text={daysSummary(s.days)} />
                <Meta
                  icon="swap-horizontal-outline"
                  text={s.tripType === 'roundtrip' ? 'Round trip' : 'One-way'}
                />
                <Meta
                  icon="time-outline"
                  text={
                    s.tripType === 'roundtrip' && s.returnTime
                      ? `${formatTime12(s.pickupTime)} · ${formatTime12(s.returnTime)}`
                      : formatTime12(s.pickupTime)
                  }
                />
              </View>

              {/* Pricing */}
              <View className="mt-4 flex-row rounded-input bg-bg p-4">
                <View className="flex-1">
                  <Text className="font-sans text-xs text-subtle">Weekly</Text>
                  <Text className="mt-0.5 font-pbold text-lg text-white">{naira(s.weeklyNaira)}</Text>
                </View>
                <View className="w-px bg-hairline" />
                <View className="flex-1 pl-4">
                  <Text className="font-sans text-xs text-subtle">Monthly</Text>
                  <Text className="mt-0.5 font-pbold text-lg text-brand">{naira(s.monthlyNaira)}</Text>
                </View>
              </View>

              <View className="mt-3 flex-row items-center justify-between">
                <Text className="font-sans text-xs text-subtle">Renews in {s.renewsInDays} days</Text>
                <Pressable onPress={() => confirmCancel(s)}>
                  <Text className="font-pmedium text-xs text-danger">Cancel</Text>
                </Pressable>
              </View>
            </View>
          ))
        )}

        <View className="mt-6">
          <KariButton label="Create a subscription" onPress={() => router.push('/subscription-new')} />
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

function Meta({ icon, text }: { icon: IconName; text: string }) {
  return (
    <View className="flex-row items-center">
      <Ionicons name={icon} size={13} color={colors.subtle} />
      <Text className="ml-1.5 font-sans text-xs text-muted">{text}</Text>
    </View>
  );
}
