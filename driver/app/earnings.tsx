import { Ionicons } from '@expo/vector-icons';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { useState } from 'react';
import { ActivityIndicator, Alert, Pressable, ScrollView, Text, View } from 'react-native';
import { LedgerDirection, TransactionType } from '@kari/types';
import { InputField, KariButton, Screen, ScreenHeader, colors } from '@kari/mobile-core';
import { paymentsApi, walletApi } from '@/api/endpoints';
import type { WalletTxn } from '@/api/types';
import { errorMessage } from '@/lib/error';

const MIN_PAYOUT = 1000;
const naira = (n: number) => '₦' + Math.round(n).toString().replace(/\B(?=(\d{3})+(?!\d))/g, ',');
const PRESETS = [1000, 5000, 10000];

const TXN_META: Record<string, { label: string; icon: keyof typeof Ionicons.glyphMap }> = {
  [TransactionType.TOPUP]: { label: 'Top-up', icon: 'add-circle-outline' },
  [TransactionType.RIDE_CHARGE]: { label: 'Trip earnings', icon: 'car-outline' },
  [TransactionType.COMMISSION]: { label: 'Commission', icon: 'cash-outline' },
  [TransactionType.RIDE_PAYOUT]: { label: 'Withdrawal', icon: 'arrow-up-circle-outline' },
  [TransactionType.PENALTY]: { label: 'Cancellation', icon: 'alert-circle-outline' },
  [TransactionType.REFUND]: { label: 'Refund', icon: 'arrow-undo-outline' },
  [TransactionType.REFERRAL]: { label: 'Referral bonus', icon: 'gift-outline' },
  [TransactionType.REWARD]: { label: 'Reward', icon: 'star-outline' },
  [TransactionType.SUBSCRIPTION]: { label: 'Subscription', icon: 'repeat-outline' },
};

export default function EarningsScreen() {
  const qc = useQueryClient();
  const [amount, setAmount] = useState<number>(1000);
  const [custom, setCustom] = useState('');
  const [busy, setBusy] = useState(false);

  const { data: earnings, isLoading } = useQuery({ queryKey: ['earnings'], queryFn: paymentsApi.earnings });
  const { data: wallet } = useQuery({ queryKey: ['wallet'], queryFn: walletApi.summary });
  const { data: txns } = useQuery({ queryKey: ['wallet-txns'], queryFn: walletApi.transactions });

  const balance = wallet?.balance ?? earnings?.balance ?? 0;
  const chosen = custom ? Number(custom) : amount;

  const withdraw = async () => {
    if (!chosen || chosen < MIN_PAYOUT) {
      Alert.alert('Enter an amount', `Minimum withdrawal is ${naira(MIN_PAYOUT)}.`);
      return;
    }
    if (chosen > balance) {
      Alert.alert('Insufficient balance', `You can withdraw up to ${naira(balance)}.`);
      return;
    }
    setBusy(true);
    try {
      const txn = await walletApi.payout(chosen);
      await Promise.all([
        qc.invalidateQueries({ queryKey: ['earnings'] }),
        qc.invalidateQueries({ queryKey: ['wallet'] }),
        qc.invalidateQueries({ queryKey: ['wallet-txns'] }),
      ]);
      setCustom('');
      Alert.alert(
        txn.status === 'SUCCESS' ? 'Withdrawal sent' : 'Withdrawal requested',
        txn.status === 'SUCCESS'
          ? `${naira(chosen)} is on its way to your bank account.`
          : `${naira(chosen)} is being processed and will reflect shortly.`,
      );
    } catch (e) {
      Alert.alert('Withdrawal failed', errorMessage(e));
    } finally {
      setBusy(false);
    }
  };

  return (
    <Screen className="px-5">
      <ScreenHeader title="Earnings" />
      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 32 }}>
        {/* Balance */}
        <View className="mt-4 rounded-card bg-brand p-6">
          <Text className="font-pmedium text-sm text-bg/70">Available to withdraw</Text>
          {isLoading ? (
            <ActivityIndicator color={colors.bg} className="mt-3 self-start" />
          ) : (
            <Text className="mt-1 font-pbold text-4xl text-bg">{naira(balance)}</Text>
          )}
        </View>

        {/* Earnings breakdown */}
        <Text className="mb-2 mt-6 font-psemibold text-lg text-white">This is how it adds up</Text>
        <View className="rounded-card bg-card p-4">
          <StatRow label="Gross trip earnings" value={naira(earnings?.grossEarnings ?? 0)} />
          <StatRow label="Commission paid" value={`− ${naira(earnings?.commissionPaid ?? 0)}`} muted />
          {(earnings?.penalties ?? 0) > 0 ? (
            <StatRow label="Cancellation fees" value={`− ${naira(earnings?.penalties ?? 0)}`} muted />
          ) : null}
          {(earnings?.cancellationCompensation ?? 0) > 0 ? (
            <StatRow
              label="Cancellation compensation"
              value={`+ ${naira(earnings?.cancellationCompensation ?? 0)}`}
              good
            />
          ) : null}
          <StatRow label="Already withdrawn" value={naira(earnings?.paidOut ?? 0)} muted last />
        </View>

        {/* Withdraw */}
        <Text className="mb-3 mt-6 font-psemibold text-lg text-white">Withdraw to bank</Text>
        <View className="flex-row flex-wrap gap-2">
          {PRESETS.map((p) => {
            const active = !custom && amount === p;
            return (
              <Pressable
                key={p}
                onPress={() => {
                  setAmount(p);
                  setCustom('');
                }}
                className={`rounded-pill border px-4 py-2 ${active ? 'border-brand bg-brand' : 'border-hairline'}`}
              >
                <Text className={`font-pmedium text-sm ${active ? 'text-bg' : 'text-muted'}`}>{naira(p)}</Text>
              </Pressable>
            );
          })}
          <Pressable
            onPress={() => setCustom(String(Math.floor(balance)))}
            className="rounded-pill border border-hairline px-4 py-2"
          >
            <Text className="font-pmedium text-sm text-muted">All</Text>
          </Pressable>
        </View>
        <View className="mt-3">
          <InputField
            label="Or enter an amount (₦)"
            value={custom}
            onChangeText={setCustom}
            keyboardType="number-pad"
            placeholder="e.g. 7500"
          />
        </View>
        <KariButton
          label={`Withdraw ${naira(chosen || 0)}`}
          onPress={withdraw}
          loading={busy}
          disabled={!chosen || chosen < MIN_PAYOUT}
        />
        <Text className="mt-2 text-center font-sans text-xs text-subtle">
          Minimum {naira(MIN_PAYOUT)} · paid to your registered bank account
        </Text>

        {/* Transactions */}
        <Text className="mb-2 mt-8 font-psemibold text-lg text-white">Recent activity</Text>
        {!txns || txns.length === 0 ? (
          <Text className="font-sans text-sm text-subtle">No transactions yet — complete a trip to start earning.</Text>
        ) : (
          <View className="overflow-hidden rounded-card bg-card">
            {txns.map((t, i) => (
              <TxnRow key={t.id} txn={t} last={i === txns.length - 1} />
            ))}
          </View>
        )}
      </ScrollView>
    </Screen>
  );
}

function StatRow({
  label,
  value,
  muted,
  good,
  last,
}: {
  label: string;
  value: string;
  muted?: boolean;
  good?: boolean;
  last?: boolean;
}) {
  return (
    <View className={`flex-row items-center justify-between py-2.5 ${last ? '' : 'border-b border-hairline'}`}>
      <Text className="font-sans text-sm text-muted">{label}</Text>
      <Text className={`font-psemibold text-sm ${good ? 'text-success' : muted ? 'text-subtle' : 'text-white'}`}>
        {value}
      </Text>
    </View>
  );
}

function TxnRow({ txn, last }: { txn: WalletTxn; last: boolean }) {
  const meta = TXN_META[txn.type] ?? { label: txn.type, icon: 'ellipse-outline' as const };
  const credit = txn.direction === LedgerDirection.CREDIT;
  const date = new Date(txn.at).toLocaleDateString(undefined, { month: 'short', day: 'numeric' });
  return (
    <View className={`flex-row items-center px-4 py-3.5 ${last ? '' : 'border-b border-hairline'}`}>
      <Ionicons name={meta.icon} size={20} color={colors.muted} />
      <View className="ml-3 flex-1">
        <Text className="font-pmedium text-sm text-white">{meta.label}</Text>
        <Text className="font-sans text-xs text-subtle">{date}</Text>
      </View>
      <Text className={`font-psemibold text-sm ${credit ? 'text-success' : 'text-white'}`}>
        {credit ? '+' : '−'}
        {naira(txn.amount)}
      </Text>
    </View>
  );
}
