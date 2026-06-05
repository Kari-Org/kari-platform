import { Ionicons } from '@expo/vector-icons';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { useState } from 'react';
import { ActivityIndicator, Alert, ScrollView, Text, View } from 'react-native';
import { CarpoolStatus } from '@kari/types';
import { KariButton, Screen, ScreenHeader, colors } from '@kari/mobile-core';
import { carpoolsApi } from '@/api/endpoints';
import type { Carpool } from '@/api/types';
import { errorMessage } from '@/lib/error';
import { useCarpoolStore } from '@/stores/carpool.store';

const naira = (n: number) => '₦' + Math.round(n).toString().replace(/\B(?=(\d{3})+(?!\d))/g, ',');
const TERMINAL: CarpoolStatus[] = [CarpoolStatus.COMPLETED, CarpoolStatus.CANCELLED];

const STATUS_META: Record<string, { label: string; color: string }> = {
  [CarpoolStatus.OPEN]: { label: 'Forming up', color: colors.subtle },
  [CarpoolStatus.MATCHED]: { label: 'Matched — drive to pickup', color: colors.brand },
  [CarpoolStatus.IN_PROGRESS]: { label: 'In progress', color: colors.brand },
  [CarpoolStatus.COMPLETED]: { label: 'Completed', color: colors.success },
  [CarpoolStatus.CANCELLED]: { label: 'Cancelled', color: colors.danger },
};

export default function CarpoolScreen() {
  const qc = useQueryClient();
  const offers = useCarpoolStore((s) => s.offers);
  const activeCarpoolId = useCarpoolStore((s) => s.activeCarpoolId);
  const setActive = useCarpoolStore((s) => s.setActive);
  const removeOffer = useCarpoolStore((s) => s.removeOffer);
  const clearOffers = useCarpoolStore((s) => s.clearOffers);
  const [busy, setBusy] = useState(false);

  const { data: active } = useQuery({
    queryKey: ['carpool', activeCarpoolId],
    queryFn: () => carpoolsApi.get(activeCarpoolId as string),
    enabled: !!activeCarpoolId,
    refetchInterval: (q) => (q.state.data && TERMINAL.includes(q.state.data.status) ? false : 5000),
  });

  const accept = async (offer: Carpool) => {
    setBusy(true);
    try {
      await carpoolsApi.accept(offer.id);
      setActive(offer.id);
      clearOffers();
      await qc.invalidateQueries({ queryKey: ['carpool', offer.id] });
    } catch (e) {
      removeOffer(offer.id);
      Alert.alert('Could not accept', errorMessage(e));
    } finally {
      setBusy(false);
    }
  };

  const complete = () =>
    Alert.alert('Complete carpool?', 'This settles every passenger’s share.', [
      { text: 'Not yet', style: 'cancel' },
      {
        text: 'Complete',
        onPress: async () => {
          setBusy(true);
          try {
            await carpoolsApi.complete(activeCarpoolId as string);
            await qc.invalidateQueries({ queryKey: ['carpool', activeCarpoolId] });
          } catch (e) {
            Alert.alert('Could not complete', errorMessage(e));
          } finally {
            setBusy(false);
          }
        },
      },
    ]);

  const cancel = () =>
    Alert.alert('Cancel carpool?', 'Passengers will be notified.', [
      { text: 'Keep', style: 'cancel' },
      {
        text: 'Cancel carpool',
        style: 'destructive',
        onPress: async () => {
          setBusy(true);
          try {
            await carpoolsApi.cancel(activeCarpoolId as string);
            await qc.invalidateQueries({ queryKey: ['carpool', activeCarpoolId] });
          } catch (e) {
            Alert.alert('Could not cancel', errorMessage(e));
          } finally {
            setBusy(false);
          }
        },
      },
    ]);

  return (
    <Screen className="px-5">
      <ScreenHeader title="Carpool" />
      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 32 }}>
        {activeCarpoolId && active ? (
          <ActiveCarpool
            carpool={active}
            busy={busy}
            onComplete={complete}
            onCancel={cancel}
            onDone={() => setActive(null)}
          />
        ) : (
          <>
            <Text className="mb-2 mt-4 font-psemibold text-lg text-white">Carpool requests</Text>
            {offers.length === 0 ? (
              <View className="mt-10 items-center">
                <Ionicons name="people-circle-outline" size={48} color={colors.subtle} />
                <Text className="mt-3 text-center font-sans text-sm text-subtle">
                  No carpool requests right now.{'\n'}Stay online — new ones appear here automatically.
                </Text>
              </View>
            ) : (
              offers.map((o) => <OfferCard key={o.id} carpool={o} busy={busy} onAccept={() => accept(o)} />)
            )}
          </>
        )}
      </ScrollView>
    </Screen>
  );
}

function Route({ pickup, dropoff }: { pickup: string | null; dropoff: string | null }) {
  return (
    <View>
      <View className="flex-row">
        <Ionicons name="ellipse" size={11} color={colors.success} />
        <Text className="ml-3 flex-1 font-pmedium text-sm text-white" numberOfLines={1}>
          {pickup ?? 'Pickup'}
        </Text>
      </View>
      <View className="ml-[5px] h-4 w-px bg-hairline" />
      <View className="flex-row">
        <Ionicons name="location" size={12} color={colors.danger} />
        <Text className="ml-3 flex-1 font-pmedium text-sm text-white" numberOfLines={1}>
          {dropoff ?? 'Destination'}
        </Text>
      </View>
    </View>
  );
}

function OfferCard({ carpool, busy, onAccept }: { carpool: Carpool; busy: boolean; onAccept: () => void }) {
  const km = (carpool.distanceMeters / 1000).toFixed(1);
  return (
    <View className="mb-3 rounded-card bg-card p-4">
      <View className="mb-3 flex-row items-center justify-between">
        <Text className="font-pbold text-base text-white">{naira(carpool.totalFare)}</Text>
        <Text className="font-pmedium text-xs text-subtle">
          {carpool.seatsTaken}/{carpool.maxSeats} seats · {km} km
        </Text>
      </View>
      <Route pickup={carpool.pickupAddress} dropoff={carpool.dropoffAddress} />
      <View className="mt-4">
        <KariButton label="Accept carpool" onPress={onAccept} loading={busy} />
      </View>
    </View>
  );
}

function ActiveCarpool({
  carpool,
  busy,
  onComplete,
  onCancel,
  onDone,
}: {
  carpool: Carpool;
  busy: boolean;
  onComplete: () => void;
  onCancel: () => void;
  onDone: () => void;
}) {
  const meta = STATUS_META[carpool.status] ?? { label: carpool.status, color: colors.subtle };
  const km = (carpool.distanceMeters / 1000).toFixed(1);
  const isTerminal = TERMINAL.includes(carpool.status);
  const canComplete =
    carpool.status === CarpoolStatus.MATCHED || carpool.status === CarpoolStatus.IN_PROGRESS;

  return (
    <View className="mt-4">
      <View className="mb-3 flex-row items-center rounded-pill bg-card px-3 py-1.5 self-start">
        <View className="mr-2 h-2 w-2 rounded-full" style={{ backgroundColor: meta.color }} />
        <Text className="font-pmedium text-xs text-white">{meta.label}</Text>
      </View>

      <View className="rounded-card bg-card p-4">
        <Route pickup={carpool.pickupAddress} dropoff={carpool.dropoffAddress} />
        <View className="mt-3 border-t border-hairline pt-3">
          <Row label="Total fare" value={naira(carpool.totalFare)} />
          <Row label="Passengers" value={`${carpool.members.length}`} />
          <Row label="Distance" value={`${km} km`} />
        </View>
      </View>

      <Text className="mb-2 mt-5 font-psemibold text-sm text-subtle">Passengers</Text>
      <View className="overflow-hidden rounded-card bg-card">
        {carpool.members.map((m, i) => (
          <View
            key={m.riderId}
            className={`flex-row items-center px-4 py-3 ${i === carpool.members.length - 1 ? '' : 'border-b border-hairline'}`}
          >
            <Ionicons name="person-circle-outline" size={22} color={colors.muted} />
            <Text className="ml-3 flex-1 font-pmedium text-sm text-white">
              Passenger {i + 1}
              {m.isCreator ? ' · host' : ''}
            </Text>
            <Text className="font-psemibold text-sm text-muted">{naira(m.shareAmount)}</Text>
          </View>
        ))}
      </View>

      <View className="mt-6">
        {canComplete ? (
          <KariButton label="Complete carpool" onPress={onComplete} loading={busy} />
        ) : null}
        {isTerminal ? (
          <KariButton label="Back" onPress={onDone} />
        ) : (
          <View className="mt-2">
            <KariButton label="Cancel carpool" variant="outline" onPress={onCancel} loading={busy} />
          </View>
        )}
      </View>
    </View>
  );
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <View className="flex-row justify-between py-1">
      <Text className="font-sans text-muted">{label}</Text>
      <Text className="font-psemibold text-white">{value}</Text>
    </View>
  );
}
