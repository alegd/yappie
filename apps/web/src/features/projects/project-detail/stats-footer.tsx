"use client";

import { AudioRecording } from "@/features/audio/types";

interface StatsFooterProps {
  audios: AudioRecording[];
}

export function StatsFooter({ audios }: StatsFooterProps) {
  const tickets = audios.flatMap((a) => a.tickets ?? []);
  const exported = tickets.filter((t) => Boolean(t.jiraIssueKey)).length;

  return (
    <div className="flex gap-6 mt-6 pt-4 border-border border-t text-muted-foreground text-sm">
      <span>{audios.length} audios</span>
      <span>{tickets.length} tickets</span>
      <span>{exported} exported</span>
    </div>
  );
}
