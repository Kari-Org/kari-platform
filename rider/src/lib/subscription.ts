// Commute subscriptions — a rider configures a recurring route (pickup/dropoff,
// one-way or round trip, weekdays, times) and the system prices it weekly/monthly.
// Backend-less for now (sample data via the subscription store); pricing is derived
// from a per-trip fare estimate (the ride quote when coordinates are known).

export type TripType = 'oneway' | 'roundtrip';

export const WEEKDAYS = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'] as const;
export type Weekday = (typeof WEEKDAYS)[number];

export interface CommuteSubscription {
  id: string;
  label: string;
  pickupAddress: string;
  dropoffAddress: string;
  tripType: TripType;
  days: Weekday[];
  pickupTime: string; // "07:00"
  returnTime?: string; // "17:30" (round trip only)
  perTripNaira: number;
  weeklyNaira: number;
  monthlyNaira: number;
  status: 'active' | 'paused';
  renewsInDays: number;
}

/** Monthly billing saves vs. paying weekly. */
export const MONTHLY_DISCOUNT = 0.1;

export function tripsPerWeek(dayCount: number, tripType: TripType): number {
  return dayCount * (tripType === 'roundtrip' ? 2 : 1);
}

/** Weekly = per-trip × trips/week; monthly = 4 weeks with the commit discount. */
export function priceSubscription(perTripNaira: number, dayCount: number, tripType: TripType) {
  const tpw = tripsPerWeek(dayCount, tripType);
  const weekly = perTripNaira * tpw;
  const monthly = Math.round(weekly * 4 * (1 - MONTHLY_DISCOUNT));
  return { tripsPerWeek: tpw, weekly: Math.round(weekly), monthly };
}

export const naira = (n: number) =>
  '₦' + Math.round(n).toString().replace(/\B(?=(\d{3})+(?!\d))/g, ',');

/** "07:00" → "7:00 AM" */
export function formatTime12(t: string): string {
  const [hStr, m] = t.split(':');
  const h = Number(hStr);
  const period = h < 12 ? 'AM' : 'PM';
  const h12 = h % 12 === 0 ? 12 : h % 12;
  return `${h12}:${m} ${period}`;
}

/** Half-hour slots from 05:00 to 22:00 for the time pickers. */
export const TIME_SLOTS: string[] = (() => {
  const out: string[] = [];
  for (let h = 5; h <= 22; h++) {
    for (const m of ['00', '30']) out.push(`${String(h).padStart(2, '0')}:${m}`);
  }
  return out;
})();

export const daysSummary = (days: Weekday[]): string => {
  const weekdays: Weekday[] = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri'];
  if (days.length === 5 && weekdays.every((d) => days.includes(d))) return 'Weekdays';
  if (days.length === 7) return 'Every day';
  // Keep canonical weekday order in the summary.
  return WEEKDAYS.filter((d) => days.includes(d)).join(', ');
};
