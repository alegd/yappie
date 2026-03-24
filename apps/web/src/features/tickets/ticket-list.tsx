"use client";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card/Card";
import { DataTable } from "@/components/ui/data-table";
import { invalidateQuery, useQuery } from "@/hooks/use-query";
import { useTableOptions } from "@/hooks/use-table-options";
import { apiFetcher } from "@/lib/api-fetcher";
import {
  JIRA_STATUS,
  TICKETS_EXPORT_BULK,
  TICKETS_LIST,
  ticketApprove,
  ticketDetail,
  ticketExport,
} from "@/lib/constants/endpoints";
import { DELETE, POST } from "@/lib/constants/http";
import { ticketDetailPage } from "@/lib/constants/pages";
import { ColumnDef, RowSelectionState } from "@tanstack/react-table";
import {
  CheckCircle2,
  FileText,
  Loader2,
  MoreVertical,
  SquareArrowOutUpRightIcon,
  Trash2,
  Upload,
} from "lucide-react";
import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import { JiraProjectSelect } from "./components/jira-project-select";
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

function ActionsMenu({
  ticket,
  isActing,
  onApprove,
  onExport,
  onDelete,
  canExport,
}: {
  ticket: Ticket;
  isActing: boolean;
  onApprove: (id: string) => void;
  onExport: (id: string) => void;
  onDelete: (id: string) => void;
  canExport: boolean;
}) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        setOpen(false);
      }
    };
    if (open) document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [open]);

  return (
    <div ref={ref} className="relative">
      <button
        onClick={(e) => {
          e.stopPropagation();
          setOpen(!open);
        }}
        className="p-1.5 rounded-md hover:bg-surface-hover transition"
        aria-label="Actions"
      >
        <MoreVertical size={16} />
      </button>

      {open && (
        <div className="absolute right-0 z-50 mt-1 w-40 bg-background border border-border rounded-md shadow-lg py-1">
          {ticket.status === "DRAFT" && (
            <button
              onClick={(e) => {
                e.stopPropagation();
                onApprove(ticket.id);
                setOpen(false);
              }}
              disabled={isActing}
              className="flex items-center gap-2 w-full px-3 py-1.5 text-sm hover:bg-surface-hover transition disabled:opacity-50"
            >
              {isActing ? (
                <Loader2 size={14} className="animate-spin" />
              ) : (
                <CheckCircle2 size={14} />
              )}
              Approve
            </button>
          )}
          {ticket.status === "APPROVED" && canExport && (
            <button
              onClick={(e) => {
                e.stopPropagation();
                onExport(ticket.id);
                setOpen(false);
              }}
              disabled={isActing}
              className="flex items-center gap-2 w-full px-3 py-1.5 text-sm hover:bg-surface-hover transition disabled:opacity-50"
            >
              {isActing ? <Loader2 size={14} className="animate-spin" /> : <Upload size={14} />}
              Export to Jira
            </button>
          )}
          <button
            onClick={(e) => {
              e.stopPropagation();
              onDelete(ticket.id);
              setOpen(false);
            }}
            disabled={isActing}
            className="flex items-center gap-2 w-full px-3 py-1.5 text-sm text-destructive hover:bg-surface-hover transition disabled:opacity-50"
          >
            <Trash2 size={14} />
            Delete
          </button>
        </div>
      )}
    </div>
  );
}

export function TicketList() {
  const tableOptions = useTableOptions({ defaultPageSize: 50 });
  const { data: ticketData, isLoading } = useQuery<TicketListResponse>(TICKETS_LIST);
  const { data: jiraStatus } = useQuery<JiraStatus>(JIRA_STATUS);
  const [acting, setActing] = useState<string | null>(null);
  const [bulkActing, setBulkActing] = useState<string | null>(null);
  const [jiraProjectKey, setJiraProjectKey] = useState("");
  const [rowSelection, setRowSelection] = useState<RowSelectionState>({});

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
      await apiFetcher(ticketDetail(id), { method: DELETE });
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
        await apiFetcher(ticketDetail(id), { method: DELETE });
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
            className="flex items-center gap-2 hover:text-blue-500 text-sm transition"
          >
            {row.original.jiraIssueKey}
            <SquareArrowOutUpRightIcon size={14} />
          </a>
        ) : (
          <span className="text-muted-foreground text-sm">—</span>
        ),
    },
    {
      id: "actions",
      header: "",
      cell: ({ row }) => {
        const ticket = row.original;
        const isActing = acting === ticket.id;

        return (
          <ActionsMenu
            ticket={ticket}
            isActing={isActing}
            onApprove={handleApprove}
            onExport={handleExport}
            onDelete={handleDelete}
            canExport={isJiraConnected && !!jiraProjectKey}
          />
        );
      },
    },
  ];

  const selectedCount = selectedIds.length;

  const toolbar = (
    <div className="flex justify-between items-center p-4 pb-0 w-full">
      <div className="flex items-center gap-4">
        {isJiraConnected && (
          <JiraProjectSelect value={jiraProjectKey} onChange={setJiraProjectKey} />
        )}
      </div>

      {selectedCount > 0 && (
        <div className="flex items-center gap-3">
          <span className="text-foreground/75 text-sm">{selectedCount} selected</span>
          {draftSelected.length > 0 && (
            <Button
              variant="outlined"
              size="sm"
              onClick={handleBulkApprove}
              disabled={bulkActing === "approve"}
            >
              {bulkActing === "approve" ? (
                <Loader2 size={16} className="animate-spin" />
              ) : (
                <CheckCircle2 size={16} />
              )}
              Approve {draftSelected.length}
            </Button>
          )}
          {approvedSelected.length > 0 && isJiraConnected && jiraProjectKey && (
            <Button
              variant="outlined"
              size="sm"
              onClick={handleBulkExport}
              disabled={bulkActing === "export"}
            >
              {bulkActing === "export" ? (
                <Loader2 size={16} className="animate-spin" />
              ) : (
                <Upload size={16} />
              )}
              Export {approvedSelected.length}
            </Button>
          )}
          <Button
            variant="outlined"
            size="sm"
            onClick={handleBulkDelete}
            disabled={bulkActing === "delete"}
            className="hover:text-red-400"
          >
            <Trash2 size={16} />
            Delete
          </Button>
        </div>
      )}
    </div>
  );

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
