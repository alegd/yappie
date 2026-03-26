"use client";

import { Card } from "@/components/ui/card/Card";
import { useQuota } from "./hooks/use-quota";

export function QuotaUsage() {
  const { quota, isLoading, usagePercentage } = useQuota();

  if (isLoading || !quota) {
    return (
      <div className="bg-surface/50 p-4 border border-border rounded-lg animate-pulse">
        <div className="h-4 w-32 bg-surface-hover rounded mb-3" />
        <div className="h-1.5 w-full bg-surface-hover rounded-full" />
      </div>
    );
  }

  const fillPercentage = Math.min(usagePercentage, 100);

  return (
    <section className="py-8">
      <h2 className="mb-4 font-semibold text-lg">Plan & Usage</h2>

      <Card className="p-4">
        <div className="flex justify-between items-center mb-2">
          <span className="text-sm text-muted-foreground">Uso este mes</span>
          <span className="text-sm font-medium">
            {quota.usedMinutes} / {quota.limitMinutes} min
          </span>
        </div>
        <div className="h-1.5 w-full bg-surface-hover rounded-full overflow-hidden">
          <div
            className="h-full rounded-full bg-gradient-to-r from-primary to-accent transition-all duration-500"
            style={{ width: `${fillPercentage}%` }}
          />
        </div>
      </Card>
    </section>
  );
}
