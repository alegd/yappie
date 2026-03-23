"use client";

import { Mic, FileText, ExternalLink, Loader2, BarChart3 } from "lucide-react";
import { useQuery } from "@/hooks/use-query";
import { analyticsOverview } from "@/lib/constants/endpoints";

interface EventCount {
  type: string;
  count: number;
}

const eventLabels: Record<string, { label: string; icon: typeof Mic; color: string }> = {
  "audio.uploaded": {
    label: "Audios Uploaded",
    icon: Mic,
    color: "text-indigo-400 bg-indigo-400/10",
  },
  "ticket.generated": {
    label: "Tickets Generated",
    icon: FileText,
    color: "text-emerald-400 bg-emerald-400/10",
  },
  "ticket.exported": {
    label: "Tickets Exported",
    icon: ExternalLink,
    color: "text-blue-400 bg-blue-400/10",
  },
};

export function AnalyticsDashboard() {
  const now = new Date();
  const from = new Date(now.getFullYear(), now.getMonth(), 1).toISOString();
  const to = now.toISOString();

  const { data: events = [], isLoading } = useQuery<EventCount[]>(analyticsOverview(from, to));

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 size={24} className="animate-spin text-muted-foreground" />
        <span className="ml-2 text-muted-foreground">Loading...</span>
      </div>
    );
  }

  return (
    <div>
      <h1 className="text-2xl font-bold mb-6">Analytics</h1>

      {events.length === 0 ? (
        <div className="text-center py-20 text-muted-foreground">
          <BarChart3 size={48} className="mx-auto mb-4 opacity-50" />
          <p>No analytics data yet.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {events.map((event) => {
            const config = eventLabels[event.type] || {
              label: event.type,
              icon: BarChart3,
              color: "text-zinc-400 bg-zinc-400/10",
            };
            const Icon = config.icon;

            return (
              <div key={event.type} className="bg-surface/50 border border-border rounded-xl p-6">
                <div
                  className={`w-10 h-10 rounded-lg flex items-center justify-center mb-3 ${config.color}`}
                >
                  <Icon size={20} />
                </div>
                <p className="text-3xl font-bold">{event.count}</p>
                <p className="text-sm text-muted-foreground mt-1">{config.label}</p>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
