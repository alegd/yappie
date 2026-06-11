"use client";

import { cn } from "@/lib/utils";
import { useEffect, useState } from "react";
import { AccountDeletionSection } from "./account-deletion-section";
import { AppearanceSection } from "./appearance-section";
import { BillingSection } from "./billing-section";
import { IntegrationsSection } from "./integrations-section";
import { QuotaUsage } from "./quota-usage";
import { AnalyticsTab } from "./tabs/analytics-tab";
import { TemplatesSection } from "./templates-section";

type TabId = "general" | "integrations" | "analytics" | "danger-zone";

const TABS: Array<{ id: TabId; label: string }> = [
  { id: "general", label: "General" },
  { id: "integrations", label: "Integrations" },
  { id: "analytics", label: "Analytics" },
  { id: "danger-zone", label: "Danger zone" },
];

function readInitialTab(): TabId {
  if (typeof window === "undefined") return "general";
  const raw = window.location.hash.replace(/^#/, "");
  const match = TABS.find((t) => t.id === raw);
  return (match?.id ?? "general") as TabId;
}

export function SettingsTabs() {
  const [active, setActive] = useState<TabId>(readInitialTab);

  useEffect(() => {
    const onHashChange = () => setActive(readInitialTab());
    window.addEventListener("hashchange", onHashChange);
    return () => window.removeEventListener("hashchange", onHashChange);
  }, []);

  const select = (id: TabId) => {
    setActive(id);
    if (typeof window !== "undefined") window.location.hash = `#${id}`;
  };

  return (
    <div className="mx-auto max-w-2xl">
      <h1 className="pb-6 font-bold text-2xl">Settings</h1>

      <div role="tablist" className="flex gap-2 border-b border-border mb-4">
        {TABS.map((tab) => (
          <button
            key={tab.id}
            role="tab"
            aria-selected={active === tab.id}
            onClick={() => select(tab.id)}
            className={cn(
              "px-3 py-2 text-sm font-medium transition border-b-2 -mb-px",
              active === tab.id
                ? "border-accent text-accent"
                : "border-transparent text-foreground/75 hover:text-foreground",
            )}
          >
            {tab.label}
          </button>
        ))}
      </div>

      <div role="tabpanel">
        {active === "general" && (
          <div className="divide-y divide-foreground/15">
            <AppearanceSection />
            <QuotaUsage />
            <BillingSection />
          </div>
        )}
        {active === "integrations" && (
          <div className="divide-y divide-foreground/15">
            <IntegrationsSection />
            <TemplatesSection />
          </div>
        )}
        {active === "analytics" && <AnalyticsTab />}
        {active === "danger-zone" && <AccountDeletionSection />}
      </div>
    </div>
  );
}
