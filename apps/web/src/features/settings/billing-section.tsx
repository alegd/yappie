"use client";

import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card/Card";
import { toast } from "@/components/ui/toast/Toast";
import { apiFetcher } from "@/lib/api-fetcher";
import { BILLING_CHECKOUT_SESSION, BILLING_PORTAL_SESSION } from "@/lib/constants/endpoints";
import { POST } from "@/lib/constants/http";
import { Loader2, Sparkles } from "lucide-react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { useEffect, useState } from "react";
import { useBillingStatus } from "./hooks/use-billing-status";

export function BillingSection() {
  const { status, mutate } = useBillingStatus();
  const [submitting, setSubmitting] = useState(false);
  const searchParams = useSearchParams();
  const router = useRouter();
  const pathname = usePathname();

  useEffect(() => {
    if (searchParams.get("upgraded") !== "true") return;

    toast.success("Welcome to Pro! Your subscription is active.");
    mutate();
    router.replace(pathname);
  }, [searchParams, mutate, router, pathname]);

  const isPro = status?.plan === "PRO";
  const willCancel = isPro && status?.cancelAtPeriodEnd;

  const handleUpgrade = async () => {
    setSubmitting(true);
    try {
      const data = await apiFetcher(BILLING_CHECKOUT_SESSION, { method: POST });
      window.location.href = data.url;
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Something went wrong");
      setSubmitting(false);
    }
  };

  const handleManage = async () => {
    setSubmitting(true);
    try {
      const data = await apiFetcher(BILLING_PORTAL_SESSION, { method: POST });
      window.location.href = data.url;
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Something went wrong");
      setSubmitting(false);
    }
  };

  return (
    <section className="py-8">
      <h2 className="mb-4 font-semibold text-lg">Billing</h2>

      <Card className="p-4">
        <div className="flex justify-between items-center">
          <div>
            <p className="font-medium">{isPro ? "Pro" : "Free"}</p>
            {willCancel ? (
              <p className="mt-0.5 text-warning text-sm">
                Will cancel at the end of the current period
              </p>
            ) : isPro ? (
              <p className="mt-0.5 text-muted-foreground text-sm">100 minutes / month</p>
            ) : (
              <p className="mt-0.5 text-muted-foreground text-sm">20 minutes / month</p>
            )}
          </div>

          {isPro ? (
            <Button variant="outlined" onClick={handleManage} disabled={submitting}>
              {submitting ? <Loader2 size={16} className="animate-spin" /> : null}
              {submitting ? "Loading..." : "Manage subscription"}
            </Button>
          ) : (
            <Button onClick={handleUpgrade} disabled={submitting}>
              {submitting ? <Loader2 size={16} className="animate-spin" /> : <Sparkles size={16} />}
              {submitting ? "Loading..." : "Upgrade to Pro"}
            </Button>
          )}
        </div>
      </Card>
    </section>
  );
}
