"use client";

import { useState } from "react";
import { FileText, Loader2, ExternalLink, CheckCircle2, Upload } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useQuery, invalidateQuery } from "@/hooks/use-query";
import { api } from "@/lib/api";
import {
  TICKETS_LIST,
  TICKETS_EXPORT_BULK,
  ticketApprove,
  ticketExport,
  JIRA_STATUS,
} from "@/lib/constants/endpoints";
import { TicketListResponse } from "./types";
import { cn } from "@/lib/utils";

const priorityColors: Record<string, string> = {
  LOW: "text-zinc-400 bg-zinc-400/10",
  MEDIUM: "text-yellow-400 bg-yellow-400/10",
  HIGH: "text-orange-400 bg-orange-400/10",
  CRITICAL: "text-red-400 bg-red-400/10",
};

const statusColors: Record<string, string> = {
  DRAFT: "text-zinc-400 bg-zinc-400/10",
  APPROVED: "text-emerald-400 bg-emerald-400/10",
  EXPORTED: "text-blue-400 bg-blue-400/10",
  REJECTED: "text-red-400 bg-red-400/10",
};

interface JiraStatus {
  connected: boolean;
  siteName: string | null;
}

export function TicketList() {
  const { data: ticketData, isLoading } = useQuery<TicketListResponse>(TICKETS_LIST);
  const { data: jiraStatus } = useQuery<JiraStatus>(JIRA_STATUS);
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [acting, setActing] = useState<string | null>(null);
  const [bulkActing, setBulkActing] = useState<string | null>(null);

  const tickets = ticketData?.data ?? [];
  const isJiraConnected = jiraStatus?.connected ?? false;

  const selectedTickets = tickets.filter((t) => selected.has(t.id));
  const draftSelected = selectedTickets.filter((t) => t.status === "DRAFT");
  const approvedSelected = selectedTickets.filter((t) => t.status === "APPROVED");

  const handleToggle = (id: string) => {
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const handleToggleAll = () => {
    if (selected.size === tickets.length) {
      setSelected(new Set());
    } else {
      setSelected(new Set(tickets.map((t) => t.id)));
    }
  };

  const handleApprove = async (id: string) => {
    setActing(id);
    try {
      await api.post(ticketApprove(id));
      invalidateQuery(TICKETS_LIST);
    } catch {
      // handle error
    } finally {
      setActing(null);
    }
  };

  const handleExport = async (id: string) => {
    setActing(id);
    try {
      await api.post(ticketExport(id, "YAP"));
      invalidateQuery(TICKETS_LIST);
    } catch {
      // handle error
    } finally {
      setActing(null);
    }
  };

  const handleBulkApprove = async () => {
    setBulkActing("approve");
    try {
      for (const ticket of draftSelected) {
        await api.post(ticketApprove(ticket.id));
      }
      invalidateQuery(TICKETS_LIST);
      setSelected(new Set());
    } catch {
      // handle error
    } finally {
      setBulkActing(null);
    }
  };

  const handleBulkExport = async () => {
    setBulkActing("export");
    try {
      await api.post(TICKETS_EXPORT_BULK, {
        ticketIds: approvedSelected.map((t) => t.id),
        projectKey: "YAP",
      });
      invalidateQuery(TICKETS_LIST);
      setSelected(new Set());
    } catch {
      // handle error
    } finally {
      setBulkActing(null);
    }
  };

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
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold">Tickets</h1>

        {/* Bulk action bar */}
        {selected.size > 0 && (
          <div className="flex items-center gap-3">
            <span className="text-sm text-muted">{selected.size} selected</span>

            {draftSelected.length > 0 && (
              <Button
                size="sm"
                onClick={handleBulkApprove}
                disabled={bulkActing !== null}
                className="bg-emerald-600 hover:bg-emerald-500"
              >
                {bulkActing === "approve" ? (
                  <Loader2 size={12} className="animate-spin" />
                ) : (
                  <CheckCircle2 size={12} />
                )}
                Approve {draftSelected.length}
              </Button>
            )}

            {approvedSelected.length > 0 && isJiraConnected && (
              <Button
                size="sm"
                onClick={handleBulkExport}
                disabled={bulkActing !== null}
                className="bg-blue-600 hover:bg-blue-500"
              >
                {bulkActing === "export" ? (
                  <Loader2 size={12} className="animate-spin" />
                ) : (
                  <Upload size={12} />
                )}
                Export {approvedSelected.length}
              </Button>
            )}
          </div>
        )}
      </div>

      {tickets.length === 0 ? (
        <div className="text-center py-20 text-muted-foreground">
          <FileText size={48} className="mx-auto mb-4 opacity-50" />
          <p>No tickets yet.</p>
          <p className="text-sm mt-1">Upload an audio and tickets will appear here.</p>
        </div>
      ) : (
        <div className="space-y-1">
          {/* Header */}
          <div className="flex items-center gap-3 px-4 py-2 text-xs font-medium text-muted-foreground uppercase tracking-wider">
            <input
              type="checkbox"
              checked={selected.size === tickets.length && tickets.length > 0}
              onChange={handleToggleAll}
              className="rounded border-zinc-600"
            />
            <span className="flex-1">Title</span>
            <span className="w-20 text-center">Priority</span>
            <span className="w-24 text-center">Status</span>
            <span className="w-20 text-center">Jira</span>
            <span className="w-24 text-center">Actions</span>
          </div>

          {/* Rows */}
          {tickets.map((ticket) => {
            const isActing = acting === ticket.id;

            return (
              <div
                key={ticket.id}
                className={cn(
                  "flex items-center gap-3 px-4 py-3 rounded-lg border transition",
                  selected.has(ticket.id)
                    ? "bg-indigo-500/5 border-indigo-500/20"
                    : "bg-surface/50 border-border hover:border-border-hover",
                )}
              >
                <input
                  type="checkbox"
                  checked={selected.has(ticket.id)}
                  onChange={() => handleToggle(ticket.id)}
                  className="rounded border-zinc-600"
                />
                <span className="flex-1 text-sm font-medium truncate">{ticket.title}</span>
                <span
                  className={cn(
                    "w-20 text-center px-2 py-0.5 rounded text-xs font-medium",
                    priorityColors[ticket.priority],
                  )}
                >
                  {ticket.priority}
                </span>
                <span
                  className={cn(
                    "w-24 text-center px-2 py-0.5 rounded text-xs font-medium",
                    statusColors[ticket.status],
                  )}
                >
                  {ticket.status}
                </span>
                <span className="w-20 text-center">
                  {ticket.jiraIssueKey ? (
                    <span className="text-xs text-blue-400 flex items-center justify-center gap-1">
                      {ticket.jiraIssueKey}
                      <ExternalLink size={10} />
                    </span>
                  ) : (
                    <span className="text-xs text-muted-foreground">—</span>
                  )}
                </span>
                <span className="w-24 flex justify-center">
                  {ticket.status === "DRAFT" && (
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleApprove(ticket.id)}
                      disabled={isActing}
                      className="text-emerald-400 hover:text-emerald-300"
                      aria-label={`Approve ${ticket.title}`}
                    >
                      {isActing ? (
                        <Loader2 size={12} className="animate-spin" />
                      ) : (
                        <CheckCircle2 size={12} />
                      )}
                      Approve
                    </Button>
                  )}
                  {ticket.status === "APPROVED" && isJiraConnected && (
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleExport(ticket.id)}
                      disabled={isActing}
                      className="text-blue-400 hover:text-blue-300"
                      aria-label={`Export ${ticket.title}`}
                    >
                      {isActing ? (
                        <Loader2 size={12} className="animate-spin" />
                      ) : (
                        <Upload size={12} />
                      )}
                      Export
                    </Button>
                  )}
                </span>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
