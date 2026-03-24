"use client";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { invalidateQuery, useQuery } from "@/hooks/use-query";
import { apiFetcher } from "@/lib/api-fetcher";
import {
  JIRA_STATUS,
  ticketApprove,
  ticketDetail,
  ticketExport,
  TICKETS_LIST,
} from "@/lib/constants/endpoints";
import { DELETE, PATCH, POST } from "@/lib/constants/http";
import { TICKETS_PAGE } from "@/lib/constants/pages";
import {
  AlertCircle,
  ArrowLeft,
  CheckCircle2,
  ExternalLink,
  Loader2,
  Pencil,
  Save,
  Trash2,
  Upload,
  X,
} from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { JiraProjectSelect } from "./components/jira-project-select";
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
  const [jiraProjectKey, setJiraProjectKey] = useState("");

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
      await apiFetcher(ticketDetail(ticketId), { data: { title, description }, method: PATCH });
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
      await apiFetcher(ticketApprove(ticketId), { method: POST });
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
      await apiFetcher(ticketDetail(ticketId), { method: DELETE });
      invalidateQuery(TICKETS_LIST);
      router.push(TICKETS_PAGE);
    } catch {
      // handle error
    }
  };

  const handleExport = async () => {
    setActing(true);
    try {
      await apiFetcher(ticketExport(ticketId, jiraProjectKey), { method: POST });
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
      <div className="flex justify-center items-center py-20">
        <Loader2 size={24} className="text-muted-foreground animate-spin" />
        <span className="ml-2 text-muted-foreground">Loading...</span>
      </div>
    );
  }

  if (fetchError || !ticket) {
    return (
      <div className="py-20 text-center">
        <AlertCircle size={48} className="opacity-50 mx-auto mb-4 text-red-400" />
        <p className="text-red-400">{fetchError?.message || "Ticket not found"}</p>
        <Link
          href={TICKETS_PAGE}
          className="inline-block mt-4 text-accent hover:text-accent text-sm"
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
              className="bg-success hover:bg-success/80"
            >
              {acting ? <Loader2 size={14} className="animate-spin" /> : <CheckCircle2 size={14} />}
              Approve
            </Button>
          )}
          {ticket.status === "APPROVED" && isJiraConnected && (
            <>
              <JiraProjectSelect value={jiraProjectKey} onChange={setJiraProjectKey} />
              <Button
                size="sm"
                onClick={handleExport}
                disabled={acting || !jiraProjectKey}
                className="bg-info hover:bg-info/80"
              >
                {acting ? <Loader2 size={14} className="animate-spin" /> : <Upload size={14} />}
                Export
              </Button>
            </>
          )}
        </div>
      </div>

      {/* Title */}
      {editing ? (
        <input
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          className="bg-surface mb-4 px-3 py-2 border border-border-hover focus:border-primary rounded-lg focus:outline-none w-full font-bold text-xl transition"
        />
      ) : (
        <h1 className="mb-4 font-bold text-xl">{ticket.title}</h1>
      )}

      {/* Description */}
      <div className="mb-6">
        <h2 className="mb-2 font-semibold text-muted text-sm uppercase tracking-wider">
          Description
        </h2>
        {editing ? (
          <textarea
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            rows={8}
            className="bg-surface px-3 py-2 border border-border-hover focus:border-primary rounded-lg focus:outline-none w-full text-sm transition resize-none"
          />
        ) : (
          <div className="bg-surface/50 p-4 border border-border rounded-lg">
            <p className="text-foreground text-sm leading-relaxed whitespace-pre-wrap">
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
      <div className="space-y-3 bg-surface/50 p-4 border border-border rounded-lg">
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
            <a
              href={ticket.jiraIssueUrl || "#"}
              target="_blank"
              rel="noopener noreferrer"
              className="text-blue-400 hover:text-blue-300 flex items-center gap-1 transition"
            >
              {ticket.jiraIssueKey}
              <ExternalLink size={12} />
            </a>
          </div>
        )}
      </div>
    </div>
  );
}
