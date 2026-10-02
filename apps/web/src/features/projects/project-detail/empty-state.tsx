"use client";

import { FileAudio, Mic } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useRecordingModalStore } from "@/features/recording/recording-modal-store";

interface EmptyStateProps {
  projectId: string;
}

export function EmptyState({ projectId }: EmptyStateProps) {
  const open = useRecordingModalStore((s) => s.open);

  return (
    <div className="py-16 text-center">
      <FileAudio size={48} className="opacity-50 mx-auto mb-4 text-muted-foreground" />
      <p className="font-medium mb-2">Record your first audio for this project</p>
      <p className="text-muted-foreground text-sm mb-6">
        Yappie will transcribe it and generate Jira tickets automatically.
      </p>
      <Button onClick={() => open(projectId)} aria-label="Record">
        <Mic size={16} />
        Record
      </Button>
    </div>
  );
}
