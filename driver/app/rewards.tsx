import { Ionicons } from '@expo/vector-icons';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { useState } from 'react';
import { ActivityIndicator, Alert, Pressable, ScrollView, Share, Text, View } from 'react-native';
import { AchievementBadge } from '@kari/types';
import { InputField, KariButton, Screen, ScreenHeader, colors } from '@kari/mobile-core';
import { driversApi, gamificationApi, referralsApi } from '@/api/endpoints';
import { errorMessage } from '@/lib/error';

const naira = (n: number) => '₦' + Math.round(n).toString().replace(/\B(?=(\d{3})+(?!\d))/g, ',');
const MEDAL = ['🥇', '🥈', '🥉'];

const BADGE_META: Record<AchievementBadge, { label: string; icon: keyof typeof Ionicons.glyphMap }> = {
  [AchievementBadge.FIRST_RIDE]: { label: 'First trip', icon: 'flag' },
  [AchievementBadge.TEN_RIDES]: { label: '10 trips', icon: 'ribbon' },
  [AchievementBadge.FIFTY_RIDES]: { label: '50 trips', icon: 'medal' },
  [AchievementBadge.HUNDRED_RIDES]: { label: '100 trips', icon: 'trophy' },
  [AchievementBadge.TOP_RATED]: { label: 'Top rated', icon: 'star' },
};

export default function RewardsScreen() {
  const qc = useQueryClient();
  const [code, setCode] = useState('');
  const [busy, setBusy] = useState(false);

  const { data: me } = useQuery({ queryKey: ['driver-me'], queryFn: driversApi.me });
  const { data: summary, isLoading } = useQuery({ queryKey: ['gamification-me'], queryFn: gamificationApi.me });
  const { data: achievements } = useQuery({ queryKey: ['achievements'], queryFn: gamificationApi.achievements });
  const { data: board } = useQuery({ queryKey: ['leaderboard'], queryFn: gamificationApi.leaderboard });
  const { data: ref } = useQuery({ queryKey: ['referral'], queryFn: referralsApi.me });

  const reductionPct = (summary?.commissionReductionBps ?? 0) / 100;

  const share = () => {
    if (!ref) return;
    void Share.share({
      message: `Drive with Kari! Use my code ${ref.code} when you sign up — we both earn ${naira(ref.rewardNaira)}.`,
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
      Alert.alert('Code applied', `You'll both earn ${naira(res.rewardOnFirstRide)}.`);
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
        {/* Weekly standing */}
        <View className="mt-4 rounded-card bg-brand p-5">
          <Text className="font-pmedium text-sm text-bg/70">This week ({summary?.weekKey ?? '—'})</Text>
          {isLoading ? (
            <ActivityIndicator color={colors.bg} className="mt-3 self-start" />
          ) : (
            <>
              <View className="mt-2 flex-row items-end">
                <Text className="font-pbold text-4xl text-bg">
                  {summary?.weekRank ? `#${summary.weekRank}` : '—'}
                </Text>
                <Text className="mb-1 ml-2 font-pmedium text-sm text-bg/70">
                  {summary?.weekPoints ?? 0} pts · {summary?.weekRides ?? 0} trips
                </Text>
              </View>
              {reductionPct > 0 ? (
                <View className="mt-3 self-start rounded-pill bg-bg/15 px-3 py-1">
                  <Text className="font-psemibold text-xs text-bg">
                    🔥 −{reductionPct % 1 === 0 ? reductionPct : reductionPct.toFixed(1)}% commission this week
                  </Text>
                </View>
              ) : (
                <Text className="mt-2 font-sans text-xs text-bg/70">
                  Reach the top 3 to unlock a commission discount.
                </Text>
              )}
            </>
          )}
        </View>

        {/* All-time + rating */}
        <View className="mt-3 flex-row gap-3">
          <View className="flex-1 rounded-card bg-card p-4">
            <Text className="font-pbold text-2xl text-white">{summary?.allTimeRides ?? 0}</Text>
            <Text className="mt-0.5 font-sans text-xs text-subtle">trips all-time</Text>
          </View>
          <View className="flex-1 rounded-card bg-card p-4">
            <Text className="font-pbold text-2xl text-white">
              ★ {(me?.ratingAvg ?? 0).toFixed(1)}
            </Text>
            <Text className="mt-0.5 font-sans text-xs text-subtle">{me?.ratingCount ?? 0} ratings</Text>
          </View>
        </View>

        {/* Achievements */}
        <Text className="mb-2 mt-8 font-psemibold text-lg text-white">Achievements</Text>
        <View className="flex-row flex-wrap gap-3">
          {(achievements ?? []).map((a) => {
            const meta = BADGE_META[a.badge] ?? { label: a.badge, icon: 'star' as const };
            return (
              <View
                key={a.badge}
                className={`w-[30%] items-center rounded-card p-3 ${a.unlocked ? 'bg-card' : 'bg-card/40'}`}
              >
                <Ionicons name={meta.icon} size={26} color={a.unlocked ? colors.brand : colors.subtle} />
                <Text
                  className={`mt-2 text-center font-pmedium text-xs ${a.unlocked ? 'text-white' : 'text-subtle'}`}
                >
                  {meta.label}
                </Text>
              </View>
            );
          })}
        </View>

        {/* Leaderboard */}
        <Text className="mb-2 mt-8 font-psemibold text-lg text-white">Top drivers this week</Text>
        {!board || board.entries.length === 0 ? (
          <Text className="font-sans text-sm text-subtle">No rankings yet this week — complete a trip to get on the board.</Text>
        ) : (
          <View className="overflow-hidden rounded-card bg-card">
            {board.entries.slice(0, 10).map((e, i, arr) => {
              const isMe = e.driverId === me?.userId;
              return (
                <View
                  key={e.driverId}
                  className={`flex-row items-center px-4 py-3 ${i === arr.length - 1 ? '' : 'border-b border-hairline'} ${isMe ? 'bg-brand/10' : ''}`}
                >
                  <Text className="w-8 font-pbold text-base text-brand">{MEDAL[e.rank - 1] ?? e.rank}</Text>
                  <Text className="ml-2 flex-1 font-pmedium text-sm text-white" numberOfLines={1}>
                    {isMe ? 'You' : e.name}
                  </Text>
                  <Text className="font-psemibold text-sm text-muted">{e.points} pts</Text>
                </View>
              );
            })}
          </View>
        )}

        {/* Referral */}
        <Text className="mb-2 mt-8 font-psemibold text-lg text-white">Invite & earn</Text>
        <View className="rounded-card bg-card p-5">
          <View className="items-center rounded-card border border-dashed border-brand bg-brand/10 py-4">
            <Text className="font-sans text-xs text-muted">YOUR CODE</Text>
            <Text className="mt-1 font-mono text-2xl tracking-[4px] text-brand">{ref?.code ?? '—'}</Text>
          </View>
          <View className="mt-3 flex-row">
            <View className="flex-1 items-center">
              <Text className="font-pbold text-xl text-white">{ref?.referralsCount ?? 0}</Text>
              <Text className="font-sans text-xs text-subtle">joined</Text>
            </View>
            <View className="flex-1 items-center">
              <Text className="font-pbold text-xl text-white">{naira(ref?.rewardNaira ?? 0)}</Text>
              <Text className="font-sans text-xs text-subtle">per referral</Text>
            </View>
          </View>
          <View className="mt-4">
            <KariButton label="Share my code" onPress={share} disabled={!ref} />
          </View>
        </View>

        {ref && !ref.referredBy ? (
          <View className="mt-4 rounded-card bg-card p-5">
            <Text className="font-psemibold text-base text-white">Have a referral code?</Text>
            <View className="mt-2">
              <InputField
                label="Enter a code"
                value={code}
                onChangeText={setCode}
                autoCapitalize="characters"
                placeholder="e.g. K7PQR2M"
              />
              <KariButton
                label="Apply code"
                variant="outline"
                onPress={apply}
                loading={busy}
                disabled={code.trim().length < 4}
              />
            </View>
          </View>
        ) : ref?.referredBy ? (
          <View className="mt-4 flex-row items-center rounded-card bg-card p-4">
            <Ionicons name="checkmark-circle" size={20} color={colors.success} />
            <Text className="ml-2 font-pmedium text-sm text-white">Referral code applied</Text>
          </View>
        ) : null}
      </ScrollView>
    </Screen>
  );
}
