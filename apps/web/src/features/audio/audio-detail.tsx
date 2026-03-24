"use client";

import { Badge } from "@/components/ui/badge";
import { useQuery } from "@/hooks/use-query";
import { audioDetail } from "@/lib/constants/endpoints";
import { AUDIOS_PAGE } from "@/lib/constants/pages";
import { AlertCircle, ArrowLeft, FileText, Loader2 } from "lucide-react";
import Link from "next/link";
import { AudioRecording } from "./types";

const statusConfig = {
  PENDING: { label: "Pending", variant: "default" as const },
  TRANSCRIBING: { label: "Transcribing", variant: "info" as const },
  ANALYZING: { label: "Analyzing", variant: "purple" as const },
  COMPLETED: { label: "Completed", variant: "success" as const },
  FAILED: { label: "Failed", variant: "danger" as const },
};

const priorityVariants: Record<string, "default" | "warning" | "orange" | "danger"> = {
  LOW: "default",
  MEDIUM: "warning",
  HIGH: "orange",
  CRITICAL: "danger",
};

const ticketStatusVariants: Record<string, "default" | "success" | "info" | "danger"> = {
  DRAFT: "default",
  APPROVED: "success",
  EXPORTED: "info",
  REJECTED: "danger",
};

interface AudioDetailProps {
  audioId: string;
}

export function AudioDetail({ audioId }: AudioDetailProps) {
  const {
    data: audio,
    error: fetchError,
    isLoading,
  } = useQuery<AudioRecording>(audioDetail(audioId));

  if (isLoading) {
    return (
      <div className="flex justify-center items-center py-20">
        <Loader2 size={24} className="text-muted-foreground animate-spin" />
        <span className="ml-2 text-muted-foreground">Loading...</span>
      </div>
    );
  }

  if (fetchError || !audio) {
    return (
      <div className="py-20 text-center">
        <AlertCircle size={48} className="opacity-50 mx-auto mb-4 text-red-400" />
        <p className="text-red-400">{fetchError?.message || "Not found"}</p>
        <Link
          href={AUDIOS_PAGE}
          className="inline-block mt-4 text-accent hover:text-accent text-sm"
        >
          Back to audios
        </Link>
      </div>
    );
  }

  const status = statusConfig[audio.status];

  return (
    <div>
      {/* Header */}
      <div className="flex items-center gap-4 mb-6">
        <Link href={AUDIOS_PAGE} className="text-muted-foreground hover:text-foreground transition">
          <ArrowLeft size={20} />
        </Link>
        <div className="flex-1">
          <h1 className="font-bold text-xl">{audio.fileName}</h1>
          <p className="mt-0.5 text-muted-foreground text-xs">
            {new Date(audio.createdAt).toLocaleString()}
          </p>
        </div>
        <Badge variant={status.variant} className="flex items-center gap-1.5 px-2.5 py-1 ">
          {status.label}
        </Badge>
      </div>

      {/* Transcription */}
      {audio.transcription && (
        <div className="mb-6">
          <h2 className="mb-2 font-semibold tracking-wider">Transcription</h2>
          <div className="bg-surface/50 p-4 border border-border rounded-lg">
            <p className="text-foreground text-sm leading-relaxed whitespace-pre-wrap">
              {audio.transcription}
            </p>
          </div>
        </div>
      )}

      {/* Tickets */}
      <div>
        <h2 className="mb-2 font-semibold text-foreground/50 text-sm tracking-wider">
          Generated Tickets ({audio.tickets?.length || 0})
        </h2>

        {!audio.tickets?.length ? (
          <div className="py-10 text-muted-foreground text-center">
            <FileText size={32} className="opacity-50 mx-auto mb-2" />
            <p className="text-sm">No tickets generated yet.</p>
          </div>
        ) : (
          <div className="space-y-2">
            {audio.tickets.map((ticket) => (
              <div
                key={ticket.id}
                className="bg-surface/50 p-4 border border-border hover:border-border-hover rounded-lg transition"
              >
                <div className="flex items-center gap-6">
                  <div className="flex-1 min-w-0 flex flex-col gap-1">
                    <p className="font-medium">{ticket.title}</p>
                    <p className="text-sm text-foreground/50 truncate">{ticket.description}</p>
                  </div>

                  <div className="flex items-center gap-3">
                    <Badge variant={priorityVariants[ticket.priority]}>{ticket.priority}</Badge>
                    <Badge variant={ticketStatusVariants[ticket.status]}>{ticket.status}</Badge>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
