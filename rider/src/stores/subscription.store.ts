import { create } from 'zustand';
import type { CommuteSubscription } from '@/lib/subscription';

// Sample seed data so the feature is explorable before the backend exists.
const SAMPLE: CommuteSubscription[] = [
  {
    id: 'sub_sample_1',
    label: 'Home – Work',
    pickupAddress: '12 Adeola Odeku St, Victoria Island, Lagos',
    dropoffAddress: 'Lekki Phase 1, Lagos',
    tripType: 'roundtrip',
    days: ['Mon', 'Tue', 'Wed', 'Thu', 'Fri'],
    pickupTime: '07:00',
    returnTime: '17:30',
    perTripNaira: 1200,
    weeklyNaira: 12000,
    monthlyNaira: 43200,
    status: 'active',
    renewsInDays: 3,
  },
  {
    id: 'sub_sample_2',
    label: 'Home – Gym',
    pickupAddress: 'Yaba, Lagos',
    dropoffAddress: 'Ikeja City Mall, Lagos',
    tripType: 'oneway',
    days: ['Mon', 'Wed', 'Fri'],
    pickupTime: '06:30',
    perTripNaira: 900,
    weeklyNaira: 2700,
    monthlyNaira: 9720,
    status: 'active',
    renewsInDays: 6,
  },
];

interface SubscriptionState {
  subscriptions: CommuteSubscription[];
  add: (sub: CommuteSubscription) => void;
  cancel: (id: string) => void;
}

export const useSubscriptions = create<SubscriptionState>((set) => ({
  subscriptions: SAMPLE,
  add: (sub) => set((s) => ({ subscriptions: [sub, ...s.subscriptions] })),
  cancel: (id) => set((s) => ({ subscriptions: s.subscriptions.filter((x) => x.id !== id) })),
}));
