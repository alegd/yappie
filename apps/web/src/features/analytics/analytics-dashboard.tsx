"use client";

import { Mic, FileText, ExternalLink, Loader2, BarChart3 } from "lucide-react";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Cell,
} from "recharts";
import { useQuery } from "@/hooks/use-query";
import { analyticsOverview } from "@/lib/constants/endpoints";

interface EventCount {
  type: string;
  count: number;
}

const eventConfig: Record<
  string,
  { label: string; icon: typeof Mic; color: string; fill: string }
> = {
  "audio.uploaded": {
    label: "Audios Uploaded",
    icon: Mic,
    color: "text-indigo-400 bg-indigo-400/10",
    fill: "#818cf8",
  },
  "ticket.generated": {
    label: "Tickets Generated",
    icon: FileText,
    color: "text-emerald-400 bg-emerald-400/10",
    fill: "#34d399",
  },
  "ticket.exported": {
    label: "Tickets Exported",
    icon: ExternalLink,
    color: "text-blue-400 bg-blue-400/10",
    fill: "#60a5fa",
  },
};

function getChartData(events: EventCount[]) {
  return events.map((event) => ({
    name: eventConfig[event.type]?.label ?? event.type,
    count: event.count,
    fill: eventConfig[event.type]?.fill ?? "#71717a",
  }));
}

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
      </div>
    );
  }

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
              <p className="text-3xl font-bold">{event.count}</p>
              <p className="text-sm text-zinc-500 mt-1">{config.label}</p>
            </div>
          );
        })}
      </div>

      {/* Bar chart */}
      <div className="bg-zinc-900/50 border border-zinc-800 rounded-xl p-6">
        <h2 className="text-sm font-semibold text-zinc-400 uppercase tracking-wider mb-4">
          Activity this month
        </h2>
        <ResponsiveContainer width="100%" height={300}>
          <BarChart data={chartData} margin={{ top: 8, right: 8, bottom: 8, left: 8 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="#27272a" />
            <XAxis
              dataKey="name"
              tick={{ fill: "#a1a1aa", fontSize: 12 }}
              axisLine={{ stroke: "#3f3f46" }}
              tickLine={false}
            />
            <YAxis
              tick={{ fill: "#a1a1aa", fontSize: 12 }}
              axisLine={{ stroke: "#3f3f46" }}
              tickLine={false}
              allowDecimals={false}
            />
            <Tooltip
              contentStyle={{
                backgroundColor: "#18181b",
                border: "1px solid #3f3f46",
                borderRadius: "8px",
                color: "#fafafa",
                fontSize: "13px",
              }}
            />
            <Bar dataKey="count" radius={[6, 6, 0, 0]} maxBarSize={80}>
              {chartData.map((entry) => (
                <Cell key={entry.name} fill={entry.fill} />
              ))}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
