import { useQuery } from "@/hooks/use-query";
import { QUOTAS } from "@/lib/constants/endpoints";

interface QuotaInfo {
  plan: string;
  limitMinutes: number;
  usedMinutes: number;
  remainingMinutes: number;
  cycleStartDate: string;
  cycleEndDate: string;
}

export function useQuota() {
  const { data, isLoading, error } = useQuery<QuotaInfo>(QUOTAS);

  const usagePercentage = data ? Math.round((data.usedMinutes / data.limitMinutes) * 100) : 0;

  return {
    quota: data,
    isLoading,
    error,
    usagePercentage,
  };
}
