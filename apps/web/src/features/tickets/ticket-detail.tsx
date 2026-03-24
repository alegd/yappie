"use client";

import { useState } from "react";
import Link from "next/link";
import {
  ArrowLeft,
  Loader2,
  AlertCircle,
  CheckCircle2,
  Upload,
  Pencil,
  X,
  Save,
  Trash2,
} from "lucide-react";
import { useRouter } from "next/navigation";
import { useQuery, invalidateQuery } from "@/hooks/use-query";
import { api } from "@/lib/api";
import {
  ticketDetail,
  ticketApprove,
  ticketExport,
  TICKETS_LIST,
  JIRA_STATUS,
} from "@/lib/constants/endpoints";
import { TICKETS_PAGE } from "@/lib/constants/pages";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Ticket } from "./types";

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
}

interface TicketDetailProps {
  ticketId: string;
}

export function TicketDetail({ ticketId }: TicketDetailProps) {
  const router = useRouter();
  const { data: ticket, error: fetchError, isLoading } = useQuery<Ticket>(ticketDetail(ticketId));
  const { data: jiraStatus } = useQuery<JiraStatus>(JIRA_STATUS);

  const [editing, setEditing] = useState(false);
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [saving, setSaving] = useState(false);
  const [acting, setActing] = useState(false);

  const isJiraConnected = jiraStatus?.connected ?? false;

  const startEditing = () => {
    if (!ticket) return;
    setTitle(ticket.title);
    setDescription(ticket.description);
    setEditing(true);
  };

  const cancelEditing = () => {
    setEditing(false);
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      await api.patch(ticketDetail(ticketId), { title, description });
      invalidateQuery(ticketDetail(ticketId));
      invalidateQuery(TICKETS_LIST);
      setEditing(false);
    } catch {
      // handle error
    } finally {
      setSaving(false);
    }
  };

  const handleApprove = async () => {
    setActing(true);
    try {
      await api.post(ticketApprove(ticketId));
      invalidateQuery(ticketDetail(ticketId));
      invalidateQuery(TICKETS_LIST);
    } catch {
      // handle error
    } finally {
      setActing(false);
    }
  };

  const handleDelete = async () => {
    if (!confirm("Are you sure you want to delete this ticket?")) return;
    try {
      await api.delete(ticketDetail(ticketId));
      invalidateQuery(TICKETS_LIST);
      router.push(TICKETS_PAGE);
    } catch {
      // handle error
    }
  };

  const handleExport = async () => {
    setActing(true);
    try {
      await api.post(ticketExport(ticketId, "YAP"));
      invalidateQuery(ticketDetail(ticketId));
      invalidateQuery(TICKETS_LIST);
    } catch {
      // handle error
    } finally {
      setActing(false);
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

  if (fetchError || !ticket) {
    return (
      <div className="text-center py-20">
        <AlertCircle size={48} className="mx-auto mb-4 text-red-400 opacity-50" />
        <p className="text-red-400">{fetchError?.message || "Ticket not found"}</p>
        <Link
          href={TICKETS_PAGE}
          className="text-sm text-accent hover:text-accent mt-4 inline-block"
        >
          Back to tickets
        </Link>
      </div>
    );
  }

  return (
    <div className="max-w-2xl">
      {/* Header */}
      <div className="flex items-center gap-4 mb-6">
        <Link
          href={TICKETS_PAGE}
          className="text-muted-foreground hover:text-foreground transition"
        >
          <ArrowLeft size={20} />
        </Link>
        <div className="flex-1">
          <div className="flex items-center gap-2">
            <Badge variant={statusVariants[ticket.status]}>{ticket.status}</Badge>
            <Badge variant={priorityVariants[ticket.priority]}>{ticket.priority}</Badge>
          </div>
        </div>

        {/* Actions */}
        <div className="flex items-center gap-2">
          <Button variant="ghost" size="sm" onClick={handleDelete} className="hover:text-red-400">
            <Trash2 size={14} />
            Delete
          </Button>
          {!editing && ticket.status === "DRAFT" && (
            <Button variant="ghost" size="sm" onClick={startEditing}>
              <Pencil size={14} />
              Edit
            </Button>
          )}
          {ticket.status === "DRAFT" && (
            <Button
              size="sm"
              onClick={handleApprove}
              disabled={acting}
              className="bg-emerald-600 hover:bg-emerald-500"
            >
              {acting ? <Loader2 size={14} className="animate-spin" /> : <CheckCircle2 size={14} />}
              Approve
            </Button>
          )}
          {ticket.status === "APPROVED" && isJiraConnected && (
            <Button
              size="sm"
              onClick={handleExport}
              disabled={acting}
              className="bg-blue-600 hover:bg-blue-500"
            >
              {acting ? <Loader2 size={14} className="animate-spin" /> : <Upload size={14} />}
              Export to Jira
            </Button>
          )}
        </div>
      </div>

      {/* Title */}
      {editing ? (
        <input
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          className="w-full bg-surface border border-border-hover rounded-lg px-3 py-2 text-xl font-bold mb-4 focus:outline-none focus:border-primary transition"
        />
      ) : (
        <h1 className="text-xl font-bold mb-4">{ticket.title}</h1>
      )}

      {/* Description */}
      <div className="mb-6">
        <h2 className="text-sm font-semibold text-muted uppercase tracking-wider mb-2">
          Description
        </h2>
        {editing ? (
          <textarea
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            rows={8}
            className="w-full bg-surface border border-border-hover rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-primary transition resize-none"
          />
        ) : (
          <div className="bg-surface/50 border border-border rounded-lg p-4">
            <p className="text-sm text-foreground leading-relaxed whitespace-pre-wrap">
              {ticket.description}
            </p>
          </div>
        )}
      </div>

      {/* Edit actions */}
      {editing && (
        <div className="flex gap-2 mb-6">
          <Button size="sm" onClick={handleSave} disabled={saving}>
            {saving ? <Loader2 size={14} className="animate-spin" /> : <Save size={14} />}
            {saving ? "Saving..." : "Save changes"}
          </Button>
          <Button variant="ghost" size="sm" onClick={cancelEditing}>
            <X size={14} />
            Cancel
          </Button>
        </div>
      )}

      {/* Metadata */}
      <div className="bg-surface/50 border border-border rounded-lg p-4 space-y-3">
        <div className="flex justify-between text-sm">
          <span className="text-muted-foreground">Created</span>
          <span>{new Date(ticket.createdAt).toLocaleString()}</span>
        </div>
        <div className="flex justify-between text-sm">
          <span className="text-muted-foreground">Last updated</span>
          <span>{new Date(ticket.updatedAt).toLocaleString()}</span>
        </div>
        {ticket.jiraIssueKey && (
          <div className="flex justify-between text-sm">
            <span className="text-muted-foreground">Jira</span>
            <span className="text-blue-400">{ticket.jiraIssueKey}</span>
          </div>
        )}
      </div>
    </div>
  );
}
