"use client";

import * as Dialog from "@radix-ui/react-dialog";
import { CheckCircle2, Loader2, Mic, SquareArrowOutUpRightIcon, X } from "lucide-react";
import Link from "next/link";
import { useEffect, useState } from "react";
import { AppSelect } from "@/components/ui/app-select";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { toast } from "@/components/ui/toast/Toast";
import { priorityVariants, ticketStatusVariants } from "@/features/tickets/badge-variants";
import type { Ticket } from "@/features/tickets/types";
import { invalidateQuery, useQuery } from "@/hooks/use-query";
import { apiFetcher } from "@/lib/api-fetcher";
import { audioDetail, ticketDetail, ticketExport } from "@/lib/constants/endpoints";
import { DELETE, PATCH, POST } from "@/lib/constants/http";
import { audioDetailPage } from "@/lib/constants/pages";

interface TicketDetailDrawerProps {
  ticketId: string | null;
  audioId: string;
  jiraConnected: boolean;
  onClose: () => void;
}

type Mode = "view" | "edit";

const PRIORITY_OPTIONS = [
  { value: "LOW", label: "Low" },
  { value: "MEDIUM", label: "Medium" },
  { value: "HIGH", label: "High" },
  { value: "CRITICAL", label: "Critical" },
];

export function TicketDetailDrawer({
  ticketId,
  audioId,
  jiraConnected,
  onClose,
}: TicketDetailDrawerProps) {
  const { data: ticket, isLoading } = useQuery<Ticket>(ticketId ? ticketDetail(ticketId) : null);

  const [mode, setMode] = useState<Mode>("view");
  const [titleDraft, setTitleDraft] = useState("");
  const [descriptionDraft, setDescriptionDraft] = useState("");
  const [priorityDraft, setPriorityDraft] = useState<string>("MEDIUM");
  const [acting, setActing] = useState<"save" | "delete" | "export" | null>(null);

  useEffect(() => {
    if (ticket) {
      setTitleDraft(ticket.title);
      setDescriptionDraft(ticket.description);
      setPriorityDraft(ticket.priority);
    }
    setMode("view");
  }, [ticket?.id]);

  if (ticketId === null) return null;

  const handleSave = async () => {
    if (!ticket) return;
    setActing("save");
    try {
      await apiFetcher(ticketDetail(ticket.id), {
        data: { title: titleDraft, description: descriptionDraft, priority: priorityDraft },
        method: PATCH,
      });
      await invalidateQuery(ticketDetail(ticket.id));
      await invalidateQuery(audioDetail(audioId));
      setMode("view");
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Something went wrong");
    } finally {
      setActing(null);
    }
  };

  const handleCancel = () => {
    if (ticket) {
      setTitleDraft(ticket.title);
      setDescriptionDraft(ticket.description);
      setPriorityDraft(ticket.priority);
    }
    setMode("view");
  };

  const handleDelete = async () => {
    if (!ticket) return;
    if (!confirm("Delete this ticket? This action cannot be undone.")) return;
    setActing("delete");
    try {
      await apiFetcher(ticketDetail(ticket.id), { method: DELETE });
      await invalidateQuery(audioDetail(audioId));
      onClose();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Something went wrong");
    } finally {
      setActing(null);
    }
  };

  const handleExport = async () => {
    if (!ticket) return;
    setActing("export");
    try {
      await apiFetcher(ticketExport(ticket.id), { method: POST });
      await invalidateQuery(ticketDetail(ticket.id));
      await invalidateQuery(audioDetail(audioId));
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Something went wrong");
    } finally {
      setActing(null);
    }
  };

  return (
    <Dialog.Root open={ticketId !== null} onOpenChange={(open) => !open && onClose()}>
      <Dialog.Portal>
        <Dialog.Overlay className="fixed inset-0 z-40 bg-black/50 backdrop-blur-sm data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0" />
        <Dialog.Content
          aria-label="Ticket detail"
          className="fixed right-0 top-0 z-50 h-full w-full md:w-[60vw] bg-background border-l border-border overflow-y-auto p-6 data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:slide-out-to-right data-[state=open]:slide-in-from-right"
        >
          <Dialog.Close
            aria-label="Close drawer"
            className="absolute right-4 top-4 text-muted-foreground hover:text-foreground transition"
          >
            <X size={20} />
          </Dialog.Close>

          {isLoading || !ticket ? (
            <div className="flex items-center justify-center py-20" aria-label="Loading ticket">
              <Loader2 size={24} className="animate-spin text-muted-foreground" />
            </div>
          ) : (
            <div className="space-y-6 pt-6">
              <div>
                {mode === "edit" ? (
                  <Input
                    value={titleDraft}
                    onChange={(e) => setTitleDraft(e.target.value)}
                    placeholder="Title"
                    aria-label="Title"
                  />
                ) : (
                  <Dialog.Title className="font-bold text-2xl">{ticket.title}</Dialog.Title>
                )}
                <div className="mt-2 flex items-center gap-2">
                  {mode === "edit" ? (
                    <AppSelect
                      value={priorityDraft}
                      onChange={setPriorityDraft}
                      options={PRIORITY_OPTIONS}
                      ariaLabel="Priority"
                    />
                  ) : (
                    <Badge variant={priorityVariants[ticket.priority]}>{ticket.priority}</Badge>
                  )}
                  <Badge variant={ticketStatusVariants[ticket.status]}>{ticket.status}</Badge>
                </div>
              </div>

              <section>
                <h3 className="text-xs uppercase tracking-wider text-foreground/75 mb-2">
                  Description
                </h3>
                {mode === "edit" ? (
                  <textarea
                    value={descriptionDraft}
                    onChange={(e) => setDescriptionDraft(e.target.value)}
                    rows={8}
                    className="bg-surface px-3 py-2 border border-border-hover focus:border-primary rounded-lg focus:outline-none w-full text-sm transition resize-none"
                    aria-label="Description"
                  />
                ) : (
                  <p className="text-sm whitespace-pre-wrap">{ticket.description}</p>
                )}
              </section>

              <section className="border-t pt-4">
                <h3 className="text-xs uppercase tracking-wider text-foreground/75 mb-2">
                  Source audio
                </h3>
                {ticket.audioRecording && (
                  <Link
                    href={audioDetailPage(ticket.audioRecording.id)}
                    className="inline-flex items-center gap-2 text-sm hover:underline"
                  >
                    <Mic size={14} />
                    {ticket.audioRecording.fileName}
                  </Link>
                )}
                {ticket.sourceTranscript ? (
                  <blockquote className="mt-2 italic text-sm pl-3 border-l-2 border-border">
                    &quot;{ticket.sourceTranscript}&quot;
                  </blockquote>
                ) : (
                  <p className="mt-2 italic text-xs text-muted-foreground">
                    Source quote not available for this ticket.
                  </p>
                )}
              </section>

              <div className="flex flex-wrap items-center gap-2 border-t pt-4">
                {mode === "view" ? (
                  <>
                    <Button onClick={() => setMode("edit")}>Edit</Button>
                    <Button
                      variant="outlined"
                      onClick={handleDelete}
                      disabled={acting === "delete"}
                      className="hover:text-destructive"
                    >
                      {acting === "delete" ? <Loader2 size={14} className="animate-spin" /> : null}
                      Delete
                    </Button>
                    {ticket.status === "EXPORTED" && ticket.jiraIssueKey ? (
                      <a
                        href={ticket.jiraIssueUrl || "#"}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center gap-1 text-info text-sm hover:underline"
                      >
                        <SquareArrowOutUpRightIcon size={14} />
                        <span>Exported:</span>
                        <span>{ticket.jiraIssueKey}</span>
                      </a>
                    ) : ticket.status === "APPROVED" && jiraConnected ? (
                      <Button
                        variant="outlined"
                        onClick={handleExport}
                        disabled={acting === "export"}
                      >
                        {acting === "export" ? (
                          <Loader2 size={14} className="animate-spin" />
                        ) : (
                          <CheckCircle2 size={14} />
                        )}
                        Export to Jira
                      </Button>
                    ) : null}
                  </>
                ) : (
                  <>
                    <Button onClick={handleSave} disabled={acting === "save"}>
                      {acting === "save" ? <Loader2 size={14} className="animate-spin" /> : null}
                      Save
                    </Button>
                    <Button variant="outlined" onClick={handleCancel}>
                      Cancel
                    </Button>
                  </>
                )}
              </div>
            </div>
          )}
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  );
}
