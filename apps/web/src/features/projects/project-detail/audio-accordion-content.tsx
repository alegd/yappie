"use client";

import { AlertCircle, Loader2 } from "lucide-react";
import { useQuery } from "@/hooks/use-query";
import { audioDetail } from "@/lib/constants/endpoints";
import type { AudioRecording } from "@/features/audio/types";
import type { Ticket } from "@/features/tickets/types";
import { BulkActionBar } from "./bulk-action-bar";
import { TicketRow } from "./ticket-row";

interface AudioAccordionContentProps {
  audioId: string;
  audioStatus: AudioRecording["status"];
  isOpen: boolean;
  selection: Set<string>;
  onSelectionChange: (next: Set<string>) => void;
  jiraConnected: boolean;
}

const inFlightLabel: Partial<Record<AudioRecording["status"], string>> = {
  PENDING: "Waiting to start processing...",
  TRANSCRIBING: "Transcribing audio...",
  ANALYZING: "Analyzing with AI...",
};

export function AudioAccordionContent({
  audioId,
  audioStatus,
  isOpen,
  selection,
  onSelectionChange,
  jiraConnected,
}: AudioAccordionContentProps) {
  const { data, isLoading } = useQuery<AudioRecording>(audioDetail(audioId), {
    revalidateIfStale: isOpen,
    revalidateOnFocus: isOpen,
    revalidateOnMount: isOpen,
  });

  if (audioStatus === "PENDING" || audioStatus === "TRANSCRIBING" || audioStatus === "ANALYZING") {
    return (
      <div className="px-4 py-3 text-muted-foreground text-sm">
        <Loader2 size={14} className="inline-block mr-2 animate-spin" />
        {inFlightLabel[audioStatus]}
      </div>
    );
  }

  if (audioStatus === "FAILED") {
    return (
      <div className="px-4 py-3 text-destructive text-sm">
        <AlertCircle size={14} className="inline-block mr-2" />
        Processing failed
        {data?.errorMessage ? <span className="ml-1">— {data.errorMessage}</span> : null}
      </div>
    );
  }

  if (isLoading || !data) {
    return (
      <div className="flex items-center justify-center py-6" aria-label="Loading audio details">
        <Loader2 size={16} className="text-muted-foreground animate-spin" />
      </div>
    );
  }

  const tickets: Ticket[] = data.tickets ?? [];

  const toggle = (ticketId: string) => {
    const next = new Set(selection);
    if (next.has(ticketId)) {
      next.delete(ticketId);
    } else {
      next.add(ticketId);
    }
    onSelectionChange(next);
  };

  const selectedTickets = tickets.filter((t) => selection.has(t.id));

  return (
    <div>
      {data.transcription && (
        <div className="px-4 py-3 border-border border-b">
          <p className="mb-2 text-foreground/75 text-xs uppercase tracking-wider">Transcript</p>
          <p className="text-sm leading-relaxed whitespace-pre-wrap">{data.transcription}</p>
        </div>
      )}

      {tickets.length === 0 ? (
        <div className="px-4 py-3 text-muted-foreground text-sm">No tickets generated.</div>
      ) : (
        <>
          <div>
            {tickets.map((ticket) => (
              <TicketRow
                key={ticket.id}
                ticket={ticket}
                isSelected={selection.has(ticket.id)}
                onToggle={toggle}
              />
            ))}
          </div>
          <BulkActionBar
            selectedTickets={selectedTickets}
            audioId={audioId}
            jiraConnected={jiraConnected}
            onCleared={() => onSelectionChange(new Set())}
          />
        </>
      )}
    </div>
  );
}
