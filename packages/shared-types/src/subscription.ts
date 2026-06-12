export type PlanType = 'free' | 'pro' | 'enterprise';
export type SubscriptionStatus = 'active' | 'past_due' | 'cancelled' | 'trialing';
export type PaymentProvider = 'razorpay';

export interface IPlanLimits {
  maxStores: number;
  maxSkusPerStore: number;
}

export interface ISubscription {
  _id: string;
  userId: string;
  plan: PlanType;
  status: SubscriptionStatus;
  limits: IPlanLimits;
  paymentProvider?: PaymentProvider;
  providerSubscriptionId?: string;
  providerCustomerId?: string;
  currentPeriodStart: string;
  currentPeriodEnd: string;
  cancelledAt?: string;
  createdAt: string;
  updatedAt: string;
}

export const PLAN_LIMITS: Record<PlanType, IPlanLimits> = {
  free: { maxStores: 1, maxSkusPerStore: 50 },
  pro: { maxStores: 5, maxSkusPerStore: 500 },
  enterprise: { maxStores: -1, maxSkusPerStore: -1 },
};
