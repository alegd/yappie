"use client";

import { Card } from "@/components/ui/card/Card";
import { useBillingStatus } from "@/features/settings/hooks/use-billing-status";
import { useQuota } from "@/features/settings/hooks/use-quota";
import { SETTINGS_PAGE } from "@/lib/constants/pages";
import { Sparkles } from "lucide-react";
import Link from "next/link";

export function QuotaWidget() {
  const { quota, isLoading, usagePercentage } = useQuota();
  const { status } = useBillingStatus();

  if (isLoading || !quota) return null;

  const fill = Math.min(usagePercentage, 100);
  const planLabel = status?.plan === "PRO" ? "Pro" : "Free";

  return (
    <Card className="p-4">
      <div className="flex justify-between items-center mb-2">
        <span className="text-sm font-medium">Usage</span>
        <span className="text-sm text-muted-foreground">
          {quota.usedMinutes} / {quota.limitMinutes} min · {planLabel}
        </span>
      </div>
      <div className="h-2 w-full bg-surface-hover rounded-full overflow-hidden">
        <div
          className="h-full rounded-full bg-gradient-to-r from-primary to-accent transition-all duration-500"
          style={{ width: `${fill}%` }}
        />
      </div>
      {status?.plan !== "PRO" && (
        <Link
          href={`${SETTINGS_PAGE}#general`}
          className="inline-flex items-center gap-1 mt-3 text-accent text-xs hover:underline"
        >
          <Sparkles size={12} />
          Upgrade plan
        </Link>
      )}
    </Card>
  );
}
