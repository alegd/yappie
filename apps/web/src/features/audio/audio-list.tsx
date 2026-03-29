"use client";

import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card/Card";
import { invalidateQuery, useQuery } from "@/hooks/use-query";
import { AUDIO_LIST, audioByProject, JIRA_STATUS, PROJECTS_LIST } from "@/lib/constants/endpoints";
import { audioDetailPage } from "@/lib/constants/pages";
import { AppSelect } from "@/components/ui/app-select";
import { AlertCircle, CheckCircle2, Clock, FileAudio, Loader2, X } from "lucide-react";
import Link from "next/link";
import { useState } from "react";
import { ProjectListResponse } from "../projects/types";
import { AudioUpload } from "./audio-upload";
import { OnboardingChecklist } from "./onboarding-checklist";
import { AudioListResponse } from "./types";

interface JiraStatus {
  connected: boolean;
  siteName: string | null;
  connectedAt: string | null;
}

const JIRA_BANNER_KEY = "yappie:jira-banner-dismissed";

const statusConfig = {
  PENDING: { label: "Pending", variant: "default" as const, icon: Clock },
  TRANSCRIBING: { label: "Transcribing", variant: "info" as const, icon: Loader2 },
  ANALYZING: { label: "Analyzing", variant: "purple" as const, icon: Loader2 },
  COMPLETED: { label: "Completed", variant: "success" as const, icon: CheckCircle2 },
  FAILED: { label: "Failed", variant: "danger" as const, icon: AlertCircle },
};

function formatDate(dateStr: string) {
  return new Date(dateStr).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

function formatSize(bytes: number) {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

function getInitialBannerDismissed(): boolean {
  try {
    return globalThis.localStorage?.getItem(JIRA_BANNER_KEY) === "true";
  } catch {
    return false;
  }
}

export function AudioList() {
  const [selectedProjectId, setSelectedProjectId] = useState<string>("");
  const [bannerDismissed, setBannerDismissed] = useState(getInitialBannerDismissed);

  const audioKey = selectedProjectId ? audioByProject(selectedProjectId) : AUDIO_LIST;

  const { data: audioData, isLoading: isLoadingAudios } = useQuery<AudioListResponse>(audioKey);
  const { data: projectData } = useQuery<ProjectListResponse>(PROJECTS_LIST);
  const { data: jiraStatus } = useQuery<JiraStatus>(JIRA_STATUS);

  const audios = audioData?.data ?? [];
  const projects = projectData?.data ?? [];
  const hasProjects = projects.length > 0;
  const jiraConnected = jiraStatus?.connected ?? false;

  const handleProjectChange = (projectId: string) => {
    setSelectedProjectId(projectId);
  };

  const handleUploaded = () => {
    invalidateQuery(audioKey);
  };

  const handleDismissBanner = () => {
    setBannerDismissed(true);
    try {
      globalThis.localStorage?.setItem(JIRA_BANNER_KEY, "true");
    } catch {
      // localStorage may not be available
    }
  };

  if (isLoadingAudios) {
    return (
      <div className="flex justify-center items-center py-20">
        <Loader2 size={24} className="text-muted-foreground animate-spin" />
      </div>
    );
  }

  if (!hasProjects) {
    return (
      <div>
        <div className="flex justify-between items-center mb-6">
          <h1 className="font-bold text-2xl">Audios</h1>
        </div>
        <OnboardingChecklist
          jiraConnected={jiraConnected}
          jiraSiteName={jiraStatus?.siteName ?? undefined}
          hasProjects={false}
        />
      </div>
    );
  }

  return (
    <div>
      {hasProjects && !jiraConnected && !bannerDismissed && (
        <div className="flex items-center justify-between gap-3 mb-4 rounded-lg border border-border bg-surface px-4 py-3">
          <p className="text-sm">
            Connect Jira to export your tickets →{" "}
            <Link href="/dashboard/settings" className="text-primary hover:underline">
              Go to Settings
            </Link>
          </p>
          <button
            onClick={handleDismissBanner}
            className="text-muted-foreground hover:text-foreground transition"
            aria-label="Dismiss Jira banner"
          >
            <X size={16} />
          </button>
        </div>
      )}

      <div className="flex justify-between items-center mb-6">
        <h1 className="font-bold text-2xl">Audios</h1>
        <div className="flex items-center gap-3">
          <AppSelect
            value={selectedProjectId}
            onChange={handleProjectChange}
            options={projects.map((p) => ({ value: p.id, label: p.name }))}
            placeholder="All projects"
            ariaLabel="Filter by project"
          />
          <AudioUpload
            projectId={selectedProjectId}
            disabled={!selectedProjectId}
            onUploaded={handleUploaded}
          />
        </div>
      </div>

      {audios.length === 0 ? (
        <div className="py-20 text-muted-foreground text-center">
          <FileAudio size={48} className="opacity-50 mx-auto mb-4" />
          <p>No audio recordings yet.</p>
          <p className="mt-1 text-sm">
            Upload an audio file or record a voice note to get started.
          </p>
        </div>
      ) : (
        <div className="space-y-3">
          {audios.map((audio) => {
            const status = statusConfig[audio.status];
            return (
              <Card>
                <Link
                  key={audio.id}
                  href={audioDetailPage(audio.id)}
                  className="flex items-center gap-4 p-4 hover:border-border-hover transition"
                >
                  <FileAudio size={20} className="text-muted-foreground shrink-0" />
                  <div className="flex-1 min-w-0">
                    <p className="font-medium text-sm truncate">{audio.fileName}</p>
                    <p className="mt-0.5 text-muted-foreground text-xs">
                      {formatSize(audio.fileSize)} · {formatDate(audio.createdAt)}
                    </p>
                  </div>
                  <Badge variant={status.variant} className="flex items-center gap-1.5 uppercase">
                    {status.label}
                  </Badge>
                </Link>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
}
