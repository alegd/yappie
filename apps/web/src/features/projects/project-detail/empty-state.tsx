"use client";

import { FileAudio } from "lucide-react";
import { AudioUpload } from "@/features/audio/audio-upload";
import { AudioRecording } from "@/features/audio/types";

interface EmptyStateProps {
  projectId: string;
  onUploaded: (recording: AudioRecording) => void;
}

export function EmptyState({ projectId, onUploaded }: EmptyStateProps) {
  return (
    <div className="py-16 text-center">
      <FileAudio size={48} className="opacity-50 mx-auto mb-4 text-muted-foreground" />
      <p className="font-medium mb-2">Record your first audio for this project</p>
      <p className="text-muted-foreground text-sm mb-6">
        Yappie will transcribe it and generate Jira tickets automatically.
      </p>
      <div className="inline-block">
        <AudioUpload projectId={projectId} onUploaded={onUploaded} />
      </div>
    </div>
  );
}
