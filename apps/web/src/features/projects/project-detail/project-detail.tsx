"use client";

import * as Accordion from "@radix-ui/react-accordion";
import { AlertCircle, Loader2 } from "lucide-react";
import { useEffect, useState } from "react";
import { useQuery, invalidateQuery } from "@/hooks/use-query";
import { useSocketEvents } from "@/hooks/use-socket-events";
import { audioByProject, JIRA_STATUS, projectDetail } from "@/lib/constants/endpoints";
import type { AudioListResponse, AudioRecording } from "@/features/audio/types";
import type { Project } from "@/features/projects/types";
import { AudioAccordion } from "./audio-accordion";
import { EmptyState } from "./empty-state";
import { ProjectHeader } from "./project-header";
import { StatsFooter } from "./stats-footer";
import { TicketDetailDrawer } from "./ticket-detail-drawer";

interface JiraStatus {
  connected: boolean;
  siteName: string | null;
}

interface ProjectDetailProps {
  id: string;
}

export function ProjectDetail({ id }: ProjectDetailProps) {
  const {
    data: project,
    isLoading: projectLoading,
    error: projectError,
  } = useQuery<Project>(projectDetail(id));
  const { data: audioData } = useQuery<AudioListResponse>(audioByProject(id));
  const { data: jiraStatus } = useQuery<JiraStatus>(JIRA_STATUS);

  const audios: AudioRecording[] = audioData?.data ?? [];
  const jiraConnected = jiraStatus?.connected ?? false;

  const [openValues, setOpenValues] = useState<string[]>([]);
  const [selectionByAudio, setSelectionByAudio] = useState<Record<string, Set<string>>>({});
  const [openTicketId, setOpenTicketId] = useState<string | null>(null);
  const [openTicketAudioId, setOpenTicketAudioId] = useState<string>("");

  const lastCompleted = useSocketEvents((s) => s.lastAudioCompleted);

  useEffect(() => {
    if (!lastCompleted) return;
    const belongsHere = audios.some((a) => a.id === lastCompleted.audioId);
    if (!belongsHere) return;
    setOpenValues((prev) =>
      prev.includes(lastCompleted.audioId) ? prev : [...prev, lastCompleted.audioId],
    );
  }, [lastCompleted, audios]);

  const handleUploaded = () => {
    invalidateQuery(audioByProject(id));
  };

  const handleToggle = (audioId: string) => {
    setOpenValues((prev) =>
      prev.includes(audioId) ? prev.filter((v) => v !== audioId) : [...prev, audioId],
    );
  };

  const setSelectionForAudio = (audioId: string) => (next: Set<string>) => {
    setSelectionByAudio((prev) => ({ ...prev, [audioId]: next }));
  };

  if (projectLoading) {
    return (
      <div className="flex justify-center items-center py-20" aria-label="Loading project">
        <Loader2 size={24} className="text-muted-foreground animate-spin" />
      </div>
    );
  }

  if (projectError || !project) {
    return (
      <div className="py-16 text-center">
        <AlertCircle size={48} className="opacity-50 mx-auto mb-4 text-destructive" />
        <p className="text-destructive">Couldn&apos;t load this project.</p>
      </div>
    );
  }

  return (
    <div>
      <ProjectHeader project={project} />

      {audios.length === 0 ? (
        <EmptyState projectId={id} onUploaded={handleUploaded} />
      ) : (
        <Accordion.Root type="multiple" value={openValues} onValueChange={setOpenValues}>
          {audios.map((audio) => (
            <AudioAccordion
              key={audio.id}
              audio={audio}
              isOpen={openValues.includes(audio.id)}
              onToggle={handleToggle}
              selection={selectionByAudio[audio.id] ?? new Set()}
              onSelectionChange={setSelectionForAudio(audio.id)}
              jiraConnected={jiraConnected}
              onTicketClick={(ticketId) => {
                setOpenTicketId(ticketId);
                setOpenTicketAudioId(audio.id);
              }}
            />
          ))}
        </Accordion.Root>
      )}

      <StatsFooter audios={audios} />
      <TicketDetailDrawer
        ticketId={openTicketId}
        audioId={openTicketAudioId}
        jiraConnected={jiraConnected}
        onClose={() => setOpenTicketId(null)}
      />
    </div>
  );
}
