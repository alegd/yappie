"use client";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card/Card";
import { DataTable } from "@/components/ui/data-table";
import { invalidateQuery, useQuery } from "@/hooks/use-query";
import { apiFetcher } from "@/lib/api-fetcher";
import {
  JIRA_PROJECTS,
  JIRA_STATUS,
  TICKETS_EXPORT_BULK,
  TICKETS_LIST,
  ticketApprove,
  ticketDetail,
  ticketExport,
} from "@/lib/constants/endpoints";
import { POST } from "@/lib/constants/http";
import { ticketDetailPage } from "@/lib/constants/pages";
import { ColumnDef, RowSelectionState } from "@tanstack/react-table";
import { CheckCircle2, ExternalLink, FileText, Loader2, Trash2, Upload } from "lucide-react";
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

interface JiraProject {
  id: string;
  key: string;
  name: string;
}

export function TicketList() {
  const tableOptions = useTableOptions({ defaultPageSize: 50 });
  const { data: ticketData, isLoading } = useQuery<TicketListResponse>(TICKETS_LIST);
  const { data: jiraStatus } = useQuery<JiraStatus>(JIRA_STATUS);
  const { data: jiraProjects } = useQuery<JiraProject[]>(
    jiraStatus?.connected ? JIRA_PROJECTS : null,
  );
  const [acting, setActing] = useState<string | null>(null);
  const [bulkActing, setBulkActing] = useState<string | null>(null);
  const [jiraProjectKey, setJiraProjectKey] = useState("");

  const tickets = ticketData?.data ?? [];
  const total = ticketData?.total ?? 0;
  const isJiraConnected = jiraStatus?.connected ?? false;

  const selectedIds = Object.keys(rowSelection).filter((k) => rowSelection[k]);
  const selectedTickets = tickets.filter((t) => selectedIds.includes(t.id));
  const draftSelected = selectedTickets.filter((t) => t.status === "DRAFT");
  const approvedSelected = selectedTickets.filter((t) => t.status === "APPROVED");

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
    if (!jiraProjectKey) return;
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
      setRowSelection({});
    } catch {
      // handle error
    } finally {
      setBulkActing(null);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Are you sure you want to delete this ticket?")) return;
    setActing(id);
    try {
      await api.delete(ticketDetail(id));
      invalidateQuery(TICKETS_LIST);
    } catch {
      // handle error
    } finally {
      setActing(null);
    }
  };

  const handleBulkDelete = async () => {
    if (!confirm(`Delete ${selectedIds.length} ticket(s)?`)) return;
    setBulkActing("delete");
    try {
      for (const id of selectedIds) {
        await api.delete(ticketDetail(id));
      }
      invalidateQuery(TICKETS_LIST);
      setRowSelection({});
    } catch {
      // handle error
    } finally {
      setBulkActing(null);
    }
  };

  const handleBulkExport = async () => {
    if (!jiraProjectKey) return;
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
      setRowSelection({});
    } catch {
      // handle error
    } finally {
      setBulkActing(null);
    }
  };

  const columns: ColumnDef<Ticket, unknown>[] = [
    {
      id: "select",
      header: ({ table }) => (
        <input
          type="checkbox"
          checked={table.getIsAllRowsSelected()}
          onChange={table.getToggleAllRowsSelectedHandler()}
          className="border-zinc-600 rounded"
        />
      ),
      cell: ({ row }) => (
        <input
          type="checkbox"
          checked={row.getIsSelected()}
          onChange={row.getToggleSelectedHandler()}
          onClick={(e) => e.stopPropagation()}
          className="border-zinc-600 rounded"
        />
      ),
      enableSorting: false,
    },
    {
      accessorKey: "title",
      header: "Title",
      cell: ({ row }) => (
        <Link
          href={ticketDetailPage(row.original.id)}
          className="font-medium hover:text-accent truncate transition"
          onClick={(e) => e.stopPropagation()}
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
          <a
            href={row.original.jiraIssueUrl || "#"}
            target="_blank"
            rel="noopener noreferrer"
            onClick={(e) => e.stopPropagation()}
            className="flex items-center gap-1 text-blue-400 hover:text-blue-300 text-xs transition"
          >
            {row.original.jiraIssueKey}
            <ExternalLink size={10} />
          </a>
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

            {approvedSelected.length > 0 && isJiraConnected && jiraProjectKey && (
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
            <Button
              variant="ghost"
              size="sm"
              onClick={(e) => {
                e.stopPropagation();
                handleDelete(ticket.id);
              }}
              disabled={isActing}
              className="hover:text-red-400"
              aria-label={`Delete ${ticket.title}`}
            >
              <Trash2 size={12} />
            </Button>
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

  return (
    <div>
      <h1 className="mb-6 font-bold text-2xl">Tickets</h1>

      <Card className="shadow-lg p-2">
        <DataTable
          columns={columns}
          data={tickets}
          count={total}
          loading={isLoading}
          enableRowSelection
          rowSelection={rowSelection}
          onRowSelectionChange={setRowSelection}
          getRowId={(row) => row.id}
          toolbar={toolbar}
          {...tableOptions}
        />
      </Card>
    </div>
  );
}
