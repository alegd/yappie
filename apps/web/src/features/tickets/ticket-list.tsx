"use client";

import { useState } from "react";
import { FileText, Loader2, ExternalLink } from "lucide-react";
import { useQuery } from "@/hooks/use-query";
import { TICKETS_LIST } from "@/lib/constants/endpoints";
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

export function TicketList() {
  const { data: ticketData, isLoading } = useQuery<TicketListResponse>(TICKETS_LIST);
  const [selected, setSelected] = useState<Set<string>>(new Set());

  const tickets = ticketData?.data ?? [];

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

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 size={24} className="animate-spin text-zinc-500" />
        <span className="ml-2 text-zinc-500">Loading...</span>
      </div>
    );
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold">Tickets</h1>
        {selected.size > 0 && (
          <span className="text-sm text-zinc-400">{selected.size} selected</span>
        )}
      </div>

      {tickets.length === 0 ? (
        <div className="text-center py-20 text-zinc-500">
          <FileText size={48} className="mx-auto mb-4 opacity-50" />
          <p>No tickets yet.</p>
          <p className="text-sm mt-1">Upload an audio and tickets will appear here.</p>
        </div>
      ) : (
        <div className="space-y-1">
          {/* Header */}
          <div className="flex items-center gap-3 px-4 py-2 text-xs font-medium text-zinc-500 uppercase tracking-wider">
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
          </div>

          {/* Rows */}
          {tickets.map((ticket) => (
            <div
              key={ticket.id}
              className={cn(
                "flex items-center gap-3 px-4 py-3 rounded-lg border transition",
                selected.has(ticket.id)
                  ? "bg-indigo-500/5 border-indigo-500/20"
                  : "bg-zinc-900/50 border-zinc-800 hover:border-zinc-700",
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
                  <span className="text-xs text-zinc-600">—</span>
                )}
              </span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
