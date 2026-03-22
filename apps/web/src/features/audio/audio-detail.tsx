"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { ArrowLeft, CheckCircle2, AlertCircle, Clock, Loader2, FileText } from "lucide-react";
import { api } from "@/lib/api";
import { AudioRecording } from "./types";
import { cn } from "@/lib/utils";

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

const priorityColors: Record<string, string> = {
  LOW: "text-zinc-400 bg-zinc-400/10",
  MEDIUM: "text-yellow-400 bg-yellow-400/10",
  HIGH: "text-orange-400 bg-orange-400/10",
  CRITICAL: "text-red-400 bg-red-400/10",
};

const ticketStatusColors: Record<string, string> = {
  DRAFT: "text-zinc-400 bg-zinc-400/10",
  APPROVED: "text-emerald-400 bg-emerald-400/10",
  EXPORTED: "text-blue-400 bg-blue-400/10",
  REJECTED: "text-red-400 bg-red-400/10",
};

interface AudioDetailProps {
  audioId: string;
}

export function AudioDetail({ audioId }: AudioDetailProps) {
  const [audio, setAudio] = useState<AudioRecording | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    const fetchAudio = async () => {
      try {
        const data = await api.get<AudioRecording>(`/audio/${audioId}`);
        setAudio(data);
      } catch (err) {
        setError(err instanceof Error ? err.message : "Not found");
      } finally {
        setLoading(false);
      }
    };

    fetchAudio();
  }, [audioId]);

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 size={24} className="animate-spin text-zinc-500" />
        <span className="ml-2 text-zinc-500">Loading...</span>
      </div>
    );
  }

  if (error || !audio) {
    return (
      <div className="text-center py-20">
        <AlertCircle size={48} className="mx-auto mb-4 text-red-400 opacity-50" />
        <p className="text-red-400">{error || "Not found"}</p>
        <Link
          href="/dashboard"
          className="text-sm text-indigo-400 hover:text-indigo-300 mt-4 inline-block"
        >
          Back to audios
        </Link>
      </div>
    );
  }

  const status = statusConfig[audio.status];
  const StatusIcon = status.icon;

  return (
    <div>
      {/* Header */}
      <div className="flex items-center gap-4 mb-6">
        <Link href="/dashboard" className="text-zinc-500 hover:text-zinc-300 transition">
          <ArrowLeft size={20} />
        </Link>
        <div className="flex-1">
          <h1 className="text-xl font-bold">{audio.fileName}</h1>
          <p className="text-xs text-zinc-500 mt-0.5">
            {new Date(audio.createdAt).toLocaleString()}
          </p>
        </div>
        <div
          className={cn(
            "flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium",
            status.color,
          )}
        >
          <StatusIcon size={12} />
          {status.label}
        </div>
      </div>

      {/* Transcription */}
      {audio.transcription && (
        <div className="mb-6">
          <h2 className="text-sm font-semibold text-zinc-400 uppercase tracking-wider mb-2">
            Transcription
          </h2>
          <div className="bg-zinc-900/50 border border-zinc-800 rounded-lg p-4">
            <p className="text-sm text-zinc-300 leading-relaxed whitespace-pre-wrap">
              {audio.transcription}
            </p>
          </div>
        </div>
      )}

      {/* Tickets */}
      <div>
        <h2 className="text-sm font-semibold text-zinc-400 uppercase tracking-wider mb-2">
          Generated Tickets ({audio.tickets?.length || 0})
        </h2>

        {!audio.tickets?.length ? (
          <div className="text-center py-10 text-zinc-500">
            <FileText size={32} className="mx-auto mb-2 opacity-50" />
            <p className="text-sm">No tickets generated yet.</p>
          </div>
        ) : (
          <div className="space-y-2">
            {audio.tickets.map((ticket) => (
              <div
                key={ticket.id}
                className="bg-zinc-900/50 border border-zinc-800 rounded-lg p-4 hover:border-zinc-700 transition"
              >
                <div className="flex items-center gap-3">
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium">{ticket.title}</p>
                  </div>
                  <span
                    className={cn(
                      "px-2 py-0.5 rounded text-xs font-medium",
                      priorityColors[ticket.priority] || "",
                    )}
                  >
                    {ticket.priority}
                  </span>
                  <span
                    className={cn(
                      "px-2 py-0.5 rounded text-xs font-medium",
                      ticketStatusColors[ticket.status] || "",
                    )}
                  >
                    {ticket.status}
                  </span>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
