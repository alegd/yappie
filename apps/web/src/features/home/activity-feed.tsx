"use client";

import { Card } from "@/components/ui/card/Card";
import { invalidateQuery, useQuery } from "@/hooks/use-query";
import { ACTIVITY_FEED } from "@/lib/constants/endpoints";
import { Loader2, RefreshCw } from "lucide-react";
import { ActivityItemRow } from "./activity-item";
import type { ActivityResponse } from "./types";

export function ActivityFeed() {
  const { data, isLoading } = useQuery<ActivityResponse>(ACTIVITY_FEED);

  const items = data?.data ?? [];

  const handleRefresh = () => {
    invalidateQuery(ACTIVITY_FEED);
  };

  return (
    <Card className="p-4">
      <div className="flex items-center justify-between mb-2">
        <h2 className="font-semibold text-sm">Recent activity</h2>
        <button
          onClick={handleRefresh}
          aria-label="Refresh activity"
          className="text-muted-foreground hover:text-foreground transition"
        >
          <RefreshCw size={14} />
        </button>
      </div>

      {isLoading ? (
        <div className="flex items-center justify-center py-6" aria-label="Loading activity">
          <Loader2 size={16} className="animate-spin text-muted-foreground" />
        </div>
      ) : items.length === 0 ? (
        <p className="text-muted-foreground text-sm py-4 text-center">
          Nothing yet — record an audio to get started.
        </p>
      ) : (
        <div className="space-y-1">
          {items.map((item) => (
            <ActivityItemRow
              key={
                item.type === "ticket.exported"
                  ? `t-${item.ticketId}`
                  : `a-${item.audioId}-${item.type}`
              }
              item={item}
            />
          ))}
        </div>
      )}
    </Card>
  );
}
