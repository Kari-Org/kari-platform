import { Ionicons } from '@expo/vector-icons';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import * as WebBrowser from 'expo-web-browser';
import { useState } from 'react';
import { ActivityIndicator, Alert, Pressable, ScrollView, Text, View } from 'react-native';
import { LedgerDirection, TransactionType } from '@kari/types';
import { walletApi } from '@/api/endpoints';
import type { WalletTxn } from '@/api/types';
import { KariButton } from '@/components/KariButton';
import { Screen } from '@/components/Screen';
import { ScreenHeader } from '@/components/ScreenHeader';
import { InputField } from '@/components/InputField';
import { errorMessage } from '@/lib/error';
import { colors } from '@/theme/tokens';

const naira = (n: number) => '₦' + Math.round(n).toString().replace(/\B(?=(\d{3})+(?!\d))/g, ',');
const PRESETS = [1000, 2000, 5000, 10000];

const TXN_META: Record<string, { label: string; icon: keyof typeof Ionicons.glyphMap }> = {
  [TransactionType.TOPUP]: { label: 'Wallet top-up', icon: 'add-circle-outline' },
  [TransactionType.RIDE_CHARGE]: { label: 'Ride fare', icon: 'car-outline' },
  [TransactionType.COMMISSION]: { label: 'Commission', icon: 'cash-outline' },
  [TransactionType.RIDE_PAYOUT]: { label: 'Payout', icon: 'arrow-up-circle-outline' },
  [TransactionType.PENALTY]: { label: 'Cancellation fee', icon: 'alert-circle-outline' },
  [TransactionType.REFUND]: { label: 'Refund', icon: 'arrow-undo-outline' },
  [TransactionType.REFERRAL]: { label: 'Referral bonus', icon: 'gift-outline' },
  [TransactionType.REWARD]: { label: 'Reward', icon: 'star-outline' },
  [TransactionType.SUBSCRIPTION]: { label: 'Subscription', icon: 'repeat-outline' },
};

export default function WalletScreen() {
  const qc = useQueryClient();
  const [amount, setAmount] = useState<number>(2000);
  const [custom, setCustom] = useState('');
  const [busy, setBusy] = useState(false);

  const { data: wallet, isLoading } = useQuery({ queryKey: ['wallet'], queryFn: walletApi.summary });
  const { data: txns } = useQuery({ queryKey: ['wallet-txns'], queryFn: walletApi.transactions });

  const chosen = custom ? Number(custom) : amount;

  const topup = async () => {
    if (!chosen || chosen < 100) {
      Alert.alert('Enter an amount', 'Minimum top-up is ₦100.');
      return;
    }
    setBusy(true);
    try {
      const init = await walletApi.topup(chosen);
      if (init.authorizationUrl && /^https?:/.test(init.authorizationUrl)) {
        await WebBrowser.openBrowserAsync(init.authorizationUrl);
      }
      const result = await walletApi.verify(init.reference);
      if (result.status === 'SUCCESS') {
        await Promise.all([
          qc.invalidateQueries({ queryKey: ['wallet'] }),
          qc.invalidateQueries({ queryKey: ['wallet-txns'] }),
        ]);
        setCustom('');
        Alert.alert('Wallet funded', `${naira(chosen)} added to your wallet.`);
      } else {
        Alert.alert('Payment pending', "We couldn't confirm your payment yet — it'll reflect shortly.");
      }
    } catch (e) {
      Alert.alert('Top-up failed', errorMessage(e));
    } finally {
      setBusy(false);
    }
  };

  return (
    <Screen className="px-5">
      <ScreenHeader title="Wallet" />
      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 32 }}>
        {/* Balance */}
        <View className="mt-4 rounded-card bg-brand p-6">
          <Text className="font-pmedium text-sm text-bg/70">Available balance</Text>
          {isLoading ? (
            <ActivityIndicator color={colors.bg} className="mt-3 self-start" />
          ) : (
            <Text className="mt-1 font-pbold text-4xl text-bg">{naira(wallet?.balance ?? 0)}</Text>
          )}
        </View>

        {/* Top-up */}
        <Text className="mb-3 mt-6 font-psemibold text-lg text-white">Add money</Text>
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
        </View>
        <View className="mt-3">
          <InputField
            label="Or enter an amount (₦)"
            value={custom}
            onChangeText={setCustom}
            keyboardType="number-pad"
            placeholder="e.g. 3500"
          />
        </View>
        <KariButton label={`Top up ${naira(chosen || 0)}`} onPress={topup} loading={busy} disabled={!chosen} />

        {/* Transactions */}
        <Text className="mb-2 mt-8 font-psemibold text-lg text-white">Recent activity</Text>
        {!txns || txns.length === 0 ? (
          <Text className="font-sans text-sm text-subtle">No transactions yet.</Text>
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
