"use client";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card/Card";
import { invalidateQuery, useQuery } from "@/hooks/use-query";
import { apiFetcher } from "@/lib/api-fetcher";
import {
  JIRA_STATUS,
  TICKETS_EXPORT_BULK,
  TICKETS_LIST,
  ticketApprove,
  ticketExport,
} from "@/lib/constants/endpoints";
import { POST } from "@/lib/constants/http";
import { ticketDetailPage } from "@/lib/constants/pages";
import { cn } from "@/lib/utils";
import { CheckCircle2, ExternalLink, FileText, Loader2, Upload } from "lucide-react";
import Link from "next/link";
import { useState } from "react";
import { JiraProjectSelect } from "./components/jira-project-select";
import { TicketListResponse } from "./types";

const priorityVariants: Record<string, "default" | "warning" | "orange" | "danger"> = {
  LOW: "default",
  MEDIUM: "warning",
  HIGH: "orange",
  CRITICAL: "danger",
};

const statusVariants: Record<string, "default" | "success" | "info" | "danger"> = {
  DRAFT: "default",
  APPROVED: "success",
  EXPORTED: "info",
  REJECTED: "danger",
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
  const [jiraProjectKey, setJiraProjectKey] = useState("");

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
      await apiFetcher(ticketApprove(id), { method: POST });
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
      await apiFetcher(ticketExport(id, jiraProjectKey), { method: POST });
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
        await apiFetcher(ticketApprove(ticket.id), { method: POST });
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
      await apiFetcher(TICKETS_EXPORT_BULK, {
        data: {
          ticketIds: approvedSelected.map((t) => t.id),
          projectKey: jiraProjectKey,
        },
        method: POST,
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
      <div className="flex justify-center items-center py-20">
        <Loader2 size={24} className="text-muted-foreground animate-spin" />
        <span className="ml-2 text-muted-foreground">Loading...</span>
      </div>
    );
  }

  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <div className="flex items-center gap-4">
          <h1 className="font-bold text-2xl">Tickets</h1>
          {isJiraConnected && (
            <JiraProjectSelect value={jiraProjectKey} onChange={setJiraProjectKey} />
          )}
        </div>

        {/* Bulk action bar */}
        {selected.size > 0 && (
          <div className="flex items-center gap-3">
            <span className="text-muted text-sm">{selected.size} selected</span>

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

            {approvedSelected.length > 0 && isJiraConnected && jiraProjectKey && (
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
        <div className="py-20 text-muted-foreground text-center">
          <FileText size={48} className="opacity-50 mx-auto mb-4" />
          <p>No tickets yet.</p>
          <p className="mt-1 text-sm">Upload an audio and tickets will appear here.</p>
        </div>
      ) : (
        <div className="space-y-2">
          {/* Header */}
          <div className="flex items-center gap-3 px-4 py-2 font-medium text-muted-foreground text-xs uppercase tracking-wider">
            <input
              type="checkbox"
              checked={selected.size === tickets.length && tickets.length > 0}
              onChange={handleToggleAll}
              className="border-zinc-600 rounded"
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
              <Card
                key={ticket.id}
                className={cn(
                  "flex items-center gap-3 px-4 py-3 border rounded-lg transition",
                  selected.has(ticket.id)
                    ? "bg-indigo-500/5 border-indigo-500/20"
                    : "border-border hover:border-border-hover",
                )}
              >
                <input
                  type="checkbox"
                  checked={selected.has(ticket.id)}
                  onChange={() => handleToggle(ticket.id)}
                  className="border-zinc-600 rounded"
                />
                <Link
                  href={ticketDetailPage(ticket.id)}
                  className="flex-1 font-medium hover:text-accent text-sm truncate transition"
                >
                  {ticket.title}
                </Link>
                <Badge variant={priorityVariants[ticket.priority]} className="w-20 text-center">
                  {ticket.priority}
                </Badge>
                <Badge variant={statusVariants[ticket.status]} className="w-24 text-center">
                  {ticket.status}
                </Badge>
                <span className="w-20 text-center">
                  {ticket.jiraIssueKey ? (
                    <span className="flex justify-center items-center gap-1 text-blue-400 text-xs">
                      {ticket.jiraIssueKey}
                      <ExternalLink size={10} />
                    </span>
                  ) : (
                    <span className="text-muted-foreground text-xs">—</span>
                  )}
                </span>
                <span className="flex justify-center w-24">
                  {ticket.status === "DRAFT" && (
                    <Button
                      variant="outlined"
                      size="sm"
                      onClick={() => handleApprove(ticket.id)}
                      disabled={isActing}
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
                  {ticket.status === "APPROVED" && isJiraConnected && jiraProjectKey && (
                    <Button
                      variant="outlined"
                      size="sm"
                      onClick={() => handleExport(ticket.id)}
                      disabled={isActing}
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
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
}
