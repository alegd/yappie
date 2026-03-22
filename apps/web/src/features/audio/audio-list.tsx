"use client";

import { invalidateQuery, useQuery } from "@/hooks/use-query";
import { AUDIO_LIST, audioByProject, PROJECTS_LIST } from "@/lib/constants/endpoints";
import { audioDetailPage } from "@/lib/constants/pages";
import { AlertCircle, CheckCircle2, Clock, FileAudio, Loader2 } from "lucide-react";
import Link from "next/link";
import { useState } from "react";
import { ProjectListResponse } from "../projects/types";
import { AudioUpload } from "./audio-upload";
import { AudioListResponse } from "./types";

const statusConfig = {
  PENDING: { label: "Pending", color: "text-zinc-400 bg-zinc-400/10", icon: Clock },
  TRANSCRIBING: { label: "Transcribing", color: "text-blue-400 bg-blue-400/10", icon: Loader2 },
  ANALYZING: { label: "Analyzing", color: "text-purple-400 bg-purple-400/10", icon: Loader2 },
  COMPLETED: {
    label: "Completed",
    color: "text-emerald-400 bg-emerald-400/10",
    icon: CheckCircle2,
  },
  FAILED: { label: "Failed", color: "text-red-400 bg-red-400/10", icon: AlertCircle },
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

export function AudioList() {
  const [selectedProjectId, setSelectedProjectId] = useState<string>("");

  const audioKey = selectedProjectId ? audioByProject(selectedProjectId) : AUDIO_LIST;

  const { data: audioData, isLoading: isLoadingAudios } = useQuery<AudioListResponse>(audioKey);
  const { data: projectData } = useQuery<ProjectListResponse>(PROJECTS_LIST);

  const audios = audioData?.data ?? [];
  const projects = projectData?.data ?? [];

  const handleProjectChange = (projectId: string) => {
    setSelectedProjectId(projectId);
  };

  const handleUploaded = () => {
    invalidateQuery(audioKey);
  };

  if (isLoadingAudios) {
    return (
      <div className="flex justify-center items-center py-20">
        <Loader2 size={24} className="text-zinc-500 animate-spin" />
      </div>
    );
  }

  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <h1 className="font-bold text-2xl">Audios</h1>
        <div className="flex items-center gap-3">
          {projects.length > 0 && (
            <select
              value={selectedProjectId}
              onChange={(e) => handleProjectChange(e.target.value)}
              className="bg-zinc-900 px-3 py-2 border border-zinc-700 focus:border-indigo-500 rounded-lg focus:outline-none text-sm"
              aria-label="Filter by project"
            >
              <option value="">All projects</option>
              {projects.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.name}
                </option>
              ))}
            </select>
          )}
          <AudioUpload projectId={selectedProjectId || undefined} onUploaded={handleUploaded} />
        </div>
      </div>

      {audios.length === 0 ? (
        <div className="py-20 text-zinc-500 text-center">
          <FileAudio size={48} className="opacity-50 mx-auto mb-4" />
          <p>No audio recordings yet.</p>
          <p className="mt-1 text-sm">
            Upload an audio file or record a voice note to get started.
          </p>
        </div>
      ) : (
        <div className="space-y-2">
          {audios.map((audio) => {
            const status = statusConfig[audio.status];
            const StatusIcon = status.icon;
            return (
              <Link
                key={audio.id}
                href={audioDetailPage(audio.id)}
                className="flex items-center gap-4 bg-zinc-900/50 p-4 border border-zinc-800 hover:border-zinc-700 rounded-lg transition"
              >
                <FileAudio size={20} className="text-zinc-500 shrink-0" />
                <div className="flex-1 min-w-0">
                  <p className="font-medium text-sm truncate">{audio.fileName}</p>
                  <p className="mt-0.5 text-zinc-500 text-xs">
                    {formatSize(audio.fileSize)} · {formatDate(audio.createdAt)}
                  </p>
                </div>
                <div
                  className={`flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium ${status.color}`}
                >
                  <StatusIcon
                    size={12}
                    className={
                      audio.status === "TRANSCRIBING" || audio.status === "ANALYZING"
                        ? "animate-spin"
                        : ""
                    }
                  />
                  {status.label}
                </div>
              </Link>
            );
          })}
        </div>
      )}
    </div>
  );
}
