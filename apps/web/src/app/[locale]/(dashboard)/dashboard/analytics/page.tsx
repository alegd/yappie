"use client";

import dynamic from "next/dynamic";
import { Loader2 } from "lucide-react";

const AnalyticsDashboard = dynamic(
  () =>
    import("@/features/analytics/analytics-dashboard").then((mod) => ({
      default: mod.AnalyticsDashboard,
    })),
  {
    ssr: false,
    loading: () => (
      <div className="flex items-center justify-center py-20">
        <Loader2 size={24} className="animate-spin text-muted-foreground" />
        <span className="ml-2 text-muted-foreground">Loading analytics...</span>
      </div>
    ),
  },
);

export default function AnalyticsPage() {
  return <AnalyticsDashboard />;
}
