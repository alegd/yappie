"use client";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card/Card";
import { DataTable } from "@/components/ui/data-table";
import { invalidateQuery, useQuery } from "@/hooks/use-query";
import { useTableOptions } from "@/hooks/use-table-options";
import { api } from "@/lib/api";
import { JIRA_STATUS, TICKETS_LIST, ticketApprove, ticketExport } from "@/lib/constants/endpoints";
import { ticketDetailPage } from "@/lib/constants/pages";
import { ColumnDef } from "@tanstack/react-table";
import { CheckCircle2, ExternalLink, FileText, Loader2, Upload } from "lucide-react";
import Link from "next/link";
import { useState } from "react";
import { Ticket, TicketListResponse } from "./types";

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
  const tableOptions = useTableOptions({ defaultPageSize: 50 });
  const { data: ticketData, isLoading } = useQuery<TicketListResponse>(TICKETS_LIST);
  const { data: jiraStatus } = useQuery<JiraStatus>(JIRA_STATUS);
  const [acting, setActing] = useState<string | null>(null);

  const tickets = ticketData?.data ?? [];
  const total = ticketData?.total ?? 0;
  const isJiraConnected = jiraStatus?.connected ?? false;

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

  const columns: ColumnDef<Ticket, unknown>[] = [
    {
      accessorKey: "title",
      header: "Title",
      cell: ({ row }) => (
        <Link
          href={ticketDetailPage(row.original.id)}
          className="font-medium hover:text-accent truncate transition"
        >
          {row.original.title}
        </Link>
      ),
    },
    {
      accessorKey: "priority",
      header: "Priority",
      cell: ({ row }) => (
        <Badge variant={priorityVariants[row.original.priority]}>{row.original.priority}</Badge>
      ),
    },
    {
      accessorKey: "status",
      header: "Status",
      cell: ({ row }) => (
        <Badge variant={statusVariants[row.original.status]}>{row.original.status}</Badge>
      ),
    },
    {
      id: "jira",
      header: "Jira",
      cell: ({ row }) =>
        row.original.jiraIssueKey ? (
          <span className="flex items-center gap-1 text-blue-400 text-xs">
            {row.original.jiraIssueKey}
            <ExternalLink size={10} />
          </span>
        ) : (
          <span className="text-muted-foreground text-xs">—</span>
        ),
    },
    {
      id: "actions",
      header: "",
      cell: ({ row }) => {
        const ticket = row.original;
        const isActing = acting === ticket.id;

        return (
          <div className="flex justify-end gap-1">
            {ticket.status === "DRAFT" && (
              <Button
                variant="outlined"
                size="sm"
                onClick={(e) => {
                  e.stopPropagation();
                  handleApprove(ticket.id);
                }}
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
            {ticket.status === "APPROVED" && isJiraConnected && (
              <Button
                variant="outlined"
                size="sm"
                onClick={(e) => {
                  e.stopPropagation();
                  handleExport(ticket.id);
                }}
                disabled={isActing}
                aria-label={`Export ${ticket.title}`}
              >
                {isActing ? <Loader2 size={12} className="animate-spin" /> : <Upload size={12} />}
                Export
              </Button>
            )}
          </div>
        );
      },
    },
  ];

  if (tickets.length === 0 && !isLoading) {
    return (
      <div>
        <h1 className="mb-6 font-bold text-2xl">Tickets</h1>
        <div className="py-20 text-muted-foreground text-center">
          <FileText size={48} className="opacity-50 mx-auto mb-4" />
          <p>No tickets yet.</p>
          <p className="mt-1 text-sm">Upload an audio and tickets will appear here.</p>
        </div>
      </div>
    );
  }

  return (
    <div>
      <h1 className="mb-6 font-bold text-2xl">Tickets</h1>

      <Card className="shadow-lg p-2">
        <DataTable
          columns={columns}
          data={tickets}
          count={total}
          loading={isLoading}
          {...tableOptions}
        />
      </Card>
    </div>
  );
}
