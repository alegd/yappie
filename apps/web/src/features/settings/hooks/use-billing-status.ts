import { useQuery } from "@/hooks/use-query";
import { BILLING_STATUS } from "@/lib/constants/endpoints";

export interface BillingStatus {
  plan: "FREE" | "PRO";
  stripeSubscriptionId: string | null;
  cancelAtPeriodEnd: boolean;
}

export function useBillingStatus() {
  const { data, isLoading, error, mutate } = useQuery<BillingStatus>(BILLING_STATUS);

  return {
    status: data,
    isLoading,
    error,
    mutate,
  };
}
