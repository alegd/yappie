"use client";

import * as Accordion from "@radix-ui/react-accordion";
import { ChevronDown } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { audioStatusConfig } from "@/features/audio/status-config";
import type { AudioRecording } from "@/features/audio/types";
import { AudioAccordionContent } from "./audio-accordion-content";

function formatDate(dateStr: string) {
  return new Date(dateStr).toLocaleString("en-US", {
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

interface AudioAccordionProps {
  audio: AudioRecording;
  isOpen: boolean;
  onToggle: (audioId: string) => void;
  selection: Set<string>;
  onSelectionChange: (next: Set<string>) => void;
  jiraConnected: boolean;
  onTicketClick: (ticketId: string) => void;
}

export function AudioAccordion({
  audio,
  isOpen,
  onToggle,
  selection,
  onSelectionChange,
  jiraConnected,
  onTicketClick,
}: AudioAccordionProps) {
  const status = audioStatusConfig[audio.status];

  return (
    <Accordion.Item
      value={audio.id}
      className="bg-background border border-border rounded-lg overflow-hidden mb-2"
    >
      <Accordion.Header>
        <Accordion.Trigger
          onClick={() => onToggle(audio.id)}
          className="flex items-center gap-3 w-full px-4 py-3 hover:bg-surface-hover/40 transition"
        >
          <ChevronDown
            size={16}
            className={`text-muted-foreground transition-transform ${isOpen ? "rotate-180" : ""}`}
          />
          <div className="flex-1 min-w-0 text-left">
            <p className="font-medium text-sm truncate">{audio.fileName}</p>
            <p className="mt-0.5 text-muted-foreground text-xs">{formatDate(audio.createdAt)}</p>
          </div>
          <Badge variant={status.variant}>{status.label}</Badge>
        </Accordion.Trigger>
      </Accordion.Header>
      <Accordion.Content>
        {isOpen ? (
          <AudioAccordionContent
            audioId={audio.id}
            audioStatus={audio.status}
            isOpen={isOpen}
            selection={selection}
            onSelectionChange={onSelectionChange}
            jiraConnected={jiraConnected}
            onTicketClick={onTicketClick}
          />
        ) : null}
      </Accordion.Content>
    </Accordion.Item>
  );
}
