import { Ionicons } from '@expo/vector-icons';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { useState } from 'react';
import { ActivityIndicator, Alert, Pressable, ScrollView, Share, Text, View } from 'react-native';
import { gamificationApi, referralsApi } from '@/api/endpoints';
import { KariButton } from '@/components/KariButton';
import { InputField } from '@/components/InputField';
import { Screen } from '@/components/Screen';
import { ScreenHeader } from '@/components/ScreenHeader';
import { errorMessage } from '@/lib/error';
import { colors } from '@/theme/tokens';

const naira = (n: number) => '₦' + Math.round(n).toString().replace(/\B(?=(\d{3})+(?!\d))/g, ',');
const MEDAL = ['🥇', '🥈', '🥉'];

export default function RewardsScreen() {
  const qc = useQueryClient();
  const [code, setCode] = useState('');
  const [busy, setBusy] = useState(false);

  const { data: ref, isLoading } = useQuery({ queryKey: ['referral'], queryFn: referralsApi.me });
  const { data: board } = useQuery({ queryKey: ['leaderboard'], queryFn: gamificationApi.leaderboard });

  const share = () => {
    if (!ref) return;
    void Share.share({
      message: `Join me on Kari! Use my code ${ref.code} when you sign up — we both earn ${naira(ref.rewardNaira)} after your first ride.`,
    });
  };

  const apply = async () => {
    const c = code.trim().toUpperCase();
    if (c.length < 4) return;
    setBusy(true);
    try {
      const res = await referralsApi.apply(c);
      await qc.invalidateQueries({ queryKey: ['referral'] });
      setCode('');
      Alert.alert('Code applied', `You'll both earn ${naira(res.rewardOnFirstRide)} after your first ride.`);
    } catch (e) {
      Alert.alert('Could not apply code', errorMessage(e));
    } finally {
      setBusy(false);
    }
  };

  return (
    <Screen className="px-5">
      <ScreenHeader title="Rewards" />
      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 32 }}>
        {/* Referral */}
        <View className="mt-4 rounded-card bg-card p-5">
          <Text className="font-psemibold text-lg text-white">Invite friends</Text>
          <Text className="mt-1 font-sans text-sm text-muted">
            Share your code — you both earn {naira(ref?.rewardNaira ?? 500)} after their first ride.
          </Text>
          {isLoading ? (
            <ActivityIndicator color={colors.brand} className="mt-4 self-start" />
          ) : (
            <>
              <View className="mt-4 items-center rounded-card border border-dashed border-brand bg-brand/10 py-4">
                <Text className="font-sans text-xs text-muted">YOUR CODE</Text>
                <Text className="mt-1 font-mono text-2xl tracking-[4px] text-brand">{ref?.code}</Text>
              </View>
              <View className="mt-3 flex-row">
                <View className="flex-1 items-center">
                  <Text className="font-pbold text-xl text-white">{ref?.referralsCount ?? 0}</Text>
                  <Text className="font-sans text-xs text-subtle">friends joined</Text>
                </View>
                <View className="flex-1 items-center">
                  <Text className="font-pbold text-xl text-white">{ref?.rewarded ? '✓' : '—'}</Text>
                  <Text className="font-sans text-xs text-subtle">your bonus</Text>
                </View>
              </View>
              <View className="mt-4">
                <KariButton label="Share my code" onPress={share} />
              </View>
            </>
          )}
        </View>

        {/* Apply a code (only if not already referred) */}
        {ref && !ref.referredBy ? (
          <View className="mt-4 rounded-card bg-card p-5">
            <Text className="font-psemibold text-base text-white">Have a referral code?</Text>
            <View className="mt-2">
              <InputField
                label="Enter a friend's code"
                value={code}
                onChangeText={setCode}
                autoCapitalize="characters"
                placeholder="e.g. K7PQR2M"
              />
              <KariButton label="Apply code" variant="outline" onPress={apply} loading={busy} disabled={code.trim().length < 4} />
            </View>
          </View>
        ) : ref?.referredBy ? (
          <View className="mt-4 flex-row items-center rounded-card bg-card p-4">
            <Ionicons name="checkmark-circle" size={20} color={colors.success} />
            <Text className="ml-2 font-pmedium text-sm text-white">Referral code applied</Text>
          </View>
        ) : null}

        {/* Leaderboard */}
        <Text className="mb-2 mt-8 font-psemibold text-lg text-white">Top drivers this week</Text>
        {!board || board.entries.length === 0 ? (
          <Text className="font-sans text-sm text-subtle">No rankings yet this week.</Text>
        ) : (
          <View className="overflow-hidden rounded-card bg-card">
            {board.entries.slice(0, 10).map((e, i) => (
              <View
                key={e.driverId}
                className={`flex-row items-center px-4 py-3 ${i === Math.min(board.entries.length, 10) - 1 ? '' : 'border-b border-hairline'}`}
              >
                <Text className="w-8 font-pbold text-base text-brand">{MEDAL[e.rank - 1] ?? e.rank}</Text>
                <Text className="ml-2 flex-1 font-pmedium text-sm text-white" numberOfLines={1}>
                  {e.name}
                </Text>
                <Text className="font-psemibold text-sm text-muted">{e.points} pts</Text>
              </View>
            ))}
          </View>
        )}
      </ScrollView>
    </Screen>
  );
}
