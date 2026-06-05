/** Static subscription plan catalog. Prices are whole naira. */
export interface SubscriptionPlan {
  id: string;
  name: string;
  priceNaira: number;
  billingCycleDays: number;
  /** null = unlimited rides for the cycle. */
  includedRides: number | null;
  sameDriver: boolean;
  description: string;
}

export const SUBSCRIPTION_PLANS: SubscriptionPlan[] = [
  {
    id: 'WEEKLY_LITE',
    name: 'Weekly Lite',
    priceNaira: 5000,
    billingCycleDays: 7,
    includedRides: 10,
    sameDriver: true,
    description: '10 rides a week with your dedicated driver.',
  },
  {
    id: 'MONTHLY_COMMUTE',
    name: 'Monthly Commute',
    priceNaira: 18000,
    billingCycleDays: 30,
    includedRides: 50,
    sameDriver: true,
    description: '50 rides a month with the same trusted driver.',
  },
  {
    id: 'MONTHLY_UNLIMITED',
    name: 'Monthly Unlimited',
    priceNaira: 35000,
    billingCycleDays: 30,
    includedRides: null,
    sameDriver: true,
    description: 'Unlimited rides, same driver, all month long.',
  },
];

export const planById = (id: string): SubscriptionPlan | undefined =>
  SUBSCRIPTION_PLANS.find((p) => p.id === id);
