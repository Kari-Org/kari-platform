import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { useCallback, useEffect, useState } from 'react';
import { ActivityIndicator, Alert, Modal, Pressable, Text, TextInput, View } from 'react-native';
import { PriceType } from '@kari/types';
import { KariButton, colors } from '@kari/mobile-core';
import { ridesApi } from '@/api/endpoints';
import type { Ride } from '@/api/types';
import { errorMessage } from '@/lib/error';
import { useRideStore } from '@/stores/ride.store';
import { SwipeToAccept } from './SwipeToAccept';

const naira = (n: number | null | undefined) =>
  n == null ? '—' : '₦' + Math.round(n).toString().replace(/\B(?=(\d{3})+(?!\d))/g, ',');

const DECIDE_WINDOW = 30; // seconds to accept/decline a fresh dispatch
const WAIT_WINDOW = 45; // seconds to wait for the rider to take our counter-offer

/**
 * Full-screen incoming-request card shown when a `ride:offer` arrives. Handles
 * both STANDARD (one-tap accept) and NEGOTIATE (accept proposed price or counter)
 * dispatches. Self-dismisses on timeout; navigates to /ride once we own the ride.
 */
export function IncomingRequest({ offer }: { offer: Ride }) {
  const router = useRouter();
  const setIncomingOffer = useRideStore((s) => s.setIncomingOffer);
  const setActiveRide = useRideStore((s) => s.setActiveRide);

  const negotiable = offer.priceType === PriceType.NEGOTIATE;
  const [phase, setPhase] = useState<'deciding' | 'countering' | 'waiting'>('deciding');
  const [counter, setCounter] = useState(String(offer.riderProposedPrice ?? offer.quotedPrice));
  const [secs, setSecs] = useState(DECIDE_WINDOW);
  const [busy, setBusy] = useState(false);

  const dismiss = useCallback(() => setIncomingOffer(null), [setIncomingOffer]);

  // Reset the clock whenever we move between decide/wait windows.
  useEffect(() => {
    setSecs(phase === 'waiting' ? WAIT_WINDOW : DECIDE_WINDOW);
  }, [phase]);

  useEffect(() => {
    const t = setInterval(() => setSecs((s) => Math.max(0, s - 1)), 1000);
    return () => clearInterval(t);
  }, [phase]);

  useEffect(() => {
    if (secs <= 0) dismiss();
  }, [secs, dismiss]);

  const accept = async () => {
    setBusy(true);
    try {
      const ride = await ridesApi.accept(offer.id);
      setIncomingOffer(null);
      setActiveRide(ride.id);
      router.replace('/ride');
    } catch (e) {
      setIncomingOffer(null);
      Alert.alert('Ride unavailable', errorMessage(e));
    } finally {
      setBusy(false);
    }
  };

  const sendOffer = async (amount: number) => {
    if (!Number.isFinite(amount) || amount <= 0) {
      Alert.alert('Enter an amount', 'Please enter a valid fare.');
      return;
    }
    if (amount > offer.quotedPrice) {
      Alert.alert('Too high', `Your offer can’t exceed the standard fare of ${naira(offer.quotedPrice)}.`);
      return;
    }
    setBusy(true);
    try {
      await ridesApi.offer(offer.id, amount);
      setCounter(String(amount));
      setPhase('waiting');
    } catch (e) {
      Alert.alert('Could not send offer', errorMessage(e));
    } finally {
      setBusy(false);
    }
  };

  const km = (offer.distanceMeters / 1000).toFixed(1);
  const mins = Math.max(1, Math.round(offer.durationSeconds / 60));
  const pct = Math.max(0, Math.min(1, secs / (phase === 'waiting' ? WAIT_WINDOW : DECIDE_WINDOW)));

  return (
    <Modal visible transparent animationType="slide" onRequestClose={dismiss}>
      <View className="flex-1 justify-end bg-black/60">
        <View className="rounded-t-[28px] bg-surface px-5 pb-9 pt-4">
          <View className="mb-3 h-1.5 w-12 self-center rounded-pill bg-hairline" />

          {/* header + countdown */}
          <View className="flex-row items-center justify-between">
            <Text className="font-pbold text-xl text-white">
              {phase === 'waiting' ? 'Offer sent' : 'New ride request'}
            </Text>
            <View className="h-10 w-10 items-center justify-center rounded-full border border-hairline">
              <Text className="font-psemibold text-sm text-brand">{secs}</Text>
            </View>
          </View>
          <View className="mt-2 h-1 overflow-hidden rounded-pill bg-hairline">
            <View className="h-1 rounded-pill bg-brand" style={{ width: `${pct * 100}%` }} />
          </View>

          {phase === 'waiting' ? (
            <View className="items-center py-10">
              <ActivityIndicator color={colors.brand} />
              <Text className="mt-4 text-center font-psemibold text-base text-white">
                Waiting for rider to accept your {naira(Number(counter))} offer…
              </Text>
              <Text className="mt-1 text-center font-sans text-sm text-subtle">
                You’ll be taken to the trip the moment they accept.
              </Text>
              <View className="mt-6 w-full">
                <KariButton label="Cancel" variant="outline" onPress={dismiss} />
              </View>
            </View>
          ) : (
            <>
              {offer.rider ? (
                <View className="mt-4 flex-row items-center justify-center">
                  <Ionicons name="person-circle" size={20} color={colors.subtle} />
                  <Text className="ml-1.5 font-pmedium text-sm text-white">{offer.rider.name}</Text>
                  {offer.rider.ratingCount > 0 ? (
                    <Text className="ml-2 font-sans text-xs text-subtle">
                      ★ {offer.rider.ratingAvg.toFixed(1)}
                    </Text>
                  ) : null}
                </View>
              ) : null}
              {/* fare */}
              <View className="mt-4 items-center">
                <Text className="font-sans text-xs uppercase tracking-wider text-subtle">
                  {negotiable ? 'Rider offers' : 'Fare'}
                </Text>
                <Text className="font-pbold text-4xl text-white">
                  {naira(negotiable ? offer.riderProposedPrice : offer.quotedPrice)}
                </Text>
                {negotiable && (
                  <Text className="mt-0.5 font-sans text-xs text-subtle">
                    Standard fare {naira(offer.quotedPrice)}
                  </Text>
                )}
              </View>

              {/* route */}
              <View className="mt-5 rounded-card bg-card p-4">
                <View className="flex-row">
                  <Ionicons name="ellipse" size={12} color={colors.success} />
                  <Text className="ml-3 flex-1 font-pmedium text-sm text-white" numberOfLines={2}>
                    {offer.pickupAddress ?? 'Pickup'}
                  </Text>
                </View>
                <View className="ml-[5px] h-5 w-px bg-hairline" />
                <View className="flex-row">
                  <Ionicons name="location" size={13} color={colors.danger} />
                  <Text className="ml-3 flex-1 font-pmedium text-sm text-white" numberOfLines={2}>
                    {offer.dropoffAddress ?? 'Destination'}
                  </Text>
                </View>
                <View className="mt-3 flex-row gap-4 border-t border-hairline pt-3">
                  <Meta icon="navigate" text={`${km} km`} />
                  <Meta icon="time" text={`~${mins} min`} />
                  <Meta icon="card" text={offer.paymentMethod} />
                </View>
              </View>

              {/* counter input */}
              {negotiable && phase === 'countering' && (
                <View className="mt-4">
                  <Text className="mb-1 font-pmedium text-sm text-muted">Your counter-offer</Text>
                  <View className="flex-row items-center rounded-input border border-hairline bg-card px-4">
                    <Text className="font-psemibold text-lg text-white">₦</Text>
                    <TextInput
                      value={counter}
                      onChangeText={setCounter}
                      keyboardType="number-pad"
                      placeholder={String(offer.quotedPrice)}
                      placeholderTextColor={colors.subtle}
                      className="ml-1 flex-1 py-3 font-psemibold text-lg text-white"
                    />
                  </View>
                  <Text className="mt-1 font-sans text-xs text-subtle">
                    Max {naira(offer.quotedPrice)} (the standard fare).
                  </Text>
                </View>
              )}

              {/* actions */}
              <View className="mt-6">
                {negotiable ? (
                  phase === 'countering' ? (
                    <>
                      <KariButton
                        label="Send counter-offer"
                        onPress={() => sendOffer(Number(counter))}
                        loading={busy}
                      />
                      <View className="mt-2">
                        <KariButton
                          label="Back"
                          variant="outline"
                          onPress={() => setPhase('deciding')}
                        />
                      </View>
                    </>
                  ) : (
                    <>
                      <KariButton
                        label={`Accept ${naira(offer.riderProposedPrice)}`}
                        onPress={() => sendOffer(offer.riderProposedPrice ?? offer.quotedPrice)}
                        loading={busy}
                      />
                      <View className="mt-2 flex-row gap-3">
                        <View className="flex-1">
                          <KariButton
                            label="Counter"
                            variant="outline"
                            onPress={() => setPhase('countering')}
                          />
                        </View>
                        <View className="flex-1">
                          <KariButton label="Decline" variant="outline" onPress={dismiss} />
                        </View>
                      </View>
                    </>
                  )
                ) : (
                  <>
                    <SwipeToAccept label="Swipe to accept" onAccept={accept} />
                    <View className="mt-2">
                      <KariButton label="Decline" variant="outline" onPress={dismiss} />
                    </View>
                  </>
                )}
              </View>
            </>
          )}
        </View>
      </View>
    </Modal>
  );
}

function Meta({ icon, text }: { icon: keyof typeof Ionicons.glyphMap; text: string }) {
  return (
    <View className="flex-row items-center">
      <Ionicons name={icon} size={14} color={colors.subtle} />
      <Text className="ml-1.5 font-sans text-xs text-muted">{text}</Text>
    </View>
  );
}
