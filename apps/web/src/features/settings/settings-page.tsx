"use client";

import { AppearanceSection } from "./appearance-section";
import { IntegrationsSection } from "./integrations-section";
import { QuotaUsage } from "./quota-usage";
import { TemplatesSection } from "./templates-section";

export function SettingsPage() {
  return (
    <div className="mx-auto max-w-2xl divide-y divide-foreground/20">
      <h1 className="pb-8 font-bold text-2xl">Settings</h1>

      <section className="py-8">
        <h2 className="mb-4 font-semibold text-lg">Plan & Usage</h2>
        <QuotaUsage />
      </section>

      <AppearanceSection />
      <IntegrationsSection />
      <TemplatesSection />
    </div>
  );
}
