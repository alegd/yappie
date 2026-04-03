export interface BillingStatus {
  plan: string;
  stripeSubscriptionId: string | null;
  cancelAtPeriodEnd: boolean;
}
