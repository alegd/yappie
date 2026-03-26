"use client";

import { AppearanceSection } from "./appearance-section";
import { IntegrationsSection } from "./integrations-section";
import { QuotaUsage } from "./quota-usage";
import { TemplatesSection } from "./templates-section";

export function SettingsPage() {
  return (
    <div className="mx-auto max-w-2xl ">
      <h1 className="pb-8 font-bold text-2xl">Settings</h1>

      <div className="divide-y divide-foreground/15">
        <QuotaUsage />
        <AppearanceSection />
        <IntegrationsSection />
        <TemplatesSection />
      </div>
    </div>
  );
}
