"use client";

import { CheckCircle2, Loader2, Upload, Link as LinkIcon } from "lucide-react";
import Link from "next/link";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { toast } from "@/components/ui/toast/Toast";
import { invalidateQuery } from "@/hooks/use-query";
import { apiFetcher } from "@/lib/api-fetcher";
import { audioDetail, ticketApprove, TICKETS_EXPORT_BULK } from "@/lib/constants/endpoints";
import { POST } from "@/lib/constants/http";
import { SETTINGS_PAGE } from "@/lib/constants/pages";
import type { Ticket } from "@/features/tickets/types";

interface BulkActionBarProps {
  selectedTickets: Ticket[];
  audioId: string;
  jiraConnected: boolean;
  onCleared: () => void;
}

export function BulkActionBar({
  selectedTickets,
  audioId,
  jiraConnected,
  onCleared,
}: BulkActionBarProps) {
  const [acting, setActing] = useState<"approve" | "export" | null>(null);

  if (selectedTickets.length === 0) return null;

  const drafts = selectedTickets.filter((t) => t.status === "DRAFT");
  const approveds = selectedTickets.filter((t) => t.status === "APPROVED");

  const handleApprove = async () => {
    setActing("approve");
    try {
      const results = await Promise.allSettled(
        drafts.map((t) => apiFetcher(ticketApprove(t.id), { method: POST })),
      );
      const failed = results.filter((r) => r.status === "rejected");
      if (failed.length > 0) {
        toast.error(`${failed.length} of ${results.length} tickets failed to approve`);
        return;
      }
      await invalidateQuery(audioDetail(audioId));
      onCleared();
    } finally {
      setActing(null);
    }
  };

  const handleExport = async () => {
    setActing("export");
    try {
      await apiFetcher(TICKETS_EXPORT_BULK, {
        data: { ticketIds: approveds.map((t) => t.id) },
        method: POST,
      });
      await invalidateQuery(audioDetail(audioId));
      onCleared();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Something went wrong");
    } finally {
      setActing(null);
    }
  };

  return (
    <div className="flex items-center justify-end gap-3 px-3 py-2 bg-surface/40 border-border border-t">
      <span className="text-foreground/75 text-xs">{selectedTickets.length} selected</span>

      {drafts.length > 0 && (
        <Button
          variant="outlined"
          size="sm"
          onClick={handleApprove}
          disabled={acting === "approve"}
        >
          {acting === "approve" ? (
            <Loader2 size={14} className="animate-spin" />
          ) : (
            <CheckCircle2 size={14} />
          )}
          Approve {drafts.length}
        </Button>
      )}

      {approveds.length > 0 && jiraConnected && (
        <Button variant="outlined" size="sm" onClick={handleExport} disabled={acting === "export"}>
          {acting === "export" ? (
            <Loader2 size={14} className="animate-spin" />
          ) : (
            <Upload size={14} />
          )}
          Export {approveds.length}
        </Button>
      )}

      {approveds.length > 0 && !jiraConnected && (
        <Link
          href={SETTINGS_PAGE}
          className="inline-flex items-center gap-1 text-accent text-xs hover:underline"
        >
          <LinkIcon size={12} />
          Connect Jira to export
        </Link>
      )}
    </div>
  );
}
