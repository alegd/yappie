import type { Plan } from ".prisma/client";

export interface BillingStatus {
  plan: Plan;
  stripeSubscriptionId: string | null;
  cancelAtPeriodEnd: boolean;
}
