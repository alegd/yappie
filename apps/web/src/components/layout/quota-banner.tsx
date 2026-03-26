"use client";

import { useQuota } from "@/features/settings/hooks/use-quota";
import { AlertTriangle } from "lucide-react";

export function QuotaBanner() {
  const { quota, isLoading, usagePercentage } = useQuota();

  if (isLoading || !quota || usagePercentage < 90) return null;

  const isExhausted = usagePercentage >= 100;

  return (
    <div
      className={`flex items-center gap-3 px-4 py-3 rounded-lg text-sm mb-4 ${
        isExhausted
          ? "bg-destructive/10 text-destructive border border-destructive/20"
          : "bg-warning/10 text-warning border border-warning/20"
      }`}
    >
      <AlertTriangle size={16} className="shrink-0" />
      <span>
        {isExhausted
          ? `Has alcanzado tu límite mensual (${quota.usedMinutes} / ${quota.limitMinutes} min)`
          : `Estás usando el ${usagePercentage}% de tu quota mensual (${quota.usedMinutes} / ${quota.limitMinutes} min)`}
      </span>
    </div>
  );
}
