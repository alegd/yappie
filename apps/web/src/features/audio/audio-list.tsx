"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Clock, FileAudio, AlertCircle, CheckCircle2, Loader2 } from "lucide-react";
import { api } from "@/lib/api";
import { AudioRecording, AudioListResponse } from "./types";
import { AudioUpload } from "./audio-upload";
import { Project } from "../projects/types";

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
  const [audios, setAudios] = useState<AudioRecording[]>([]);
  const [projects, setProjects] = useState<Project[]>([]);
  const [selectedProjectId, setSelectedProjectId] = useState<string>("");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [audioData, projectData] = await Promise.all([
          api.get<AudioListResponse>("/audio?limit=50"),
          api.get<{ data: Project[] }>("/projects?limit=50"),
        ]);
        setAudios(audioData.data);
        setProjects(projectData.data);
      } catch {
        // silently fail
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  const handleUploaded = (recording: AudioRecording) => {
    setAudios((prev) => [recording, ...prev]);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 size={24} className="animate-spin text-zinc-500" />
      </div>
    );
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold">Audios</h1>
        <div className="flex items-center gap-3">
          {projects.length > 0 && (
            <select
              value={selectedProjectId}
              onChange={(e) => setSelectedProjectId(e.target.value)}
              className="bg-zinc-900 border border-zinc-700 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-indigo-500"
              aria-label="Select project"
            >
              <option value="">No project</option>
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
        <div className="text-center py-20 text-zinc-500">
          <FileAudio size={48} className="mx-auto mb-4 opacity-50" />
          <p>No audio recordings yet.</p>
          <p className="text-sm mt-1">
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
                href={`/dashboard/audio/${audio.id}`}
                className="flex items-center gap-4 bg-zinc-900/50 border border-zinc-800 rounded-lg p-4 hover:border-zinc-700 transition"
              >
                <FileAudio size={20} className="text-zinc-500 shrink-0" />
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium truncate">{audio.fileName}</p>
                  <p className="text-xs text-zinc-500 mt-0.5">
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
