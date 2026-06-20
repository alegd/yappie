"use client";

import { Mic } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card/Card";
import { useRecordingModalStore } from "@/features/recording/recording-modal-store";
import type { Project } from "@/features/projects/types";

interface QuickRecordProps {
  projects: Project[];
}

export function QuickRecord({ projects }: QuickRecordProps) {
  const open = useRecordingModalStore((s) => s.open);
  const hasProjects = projects.length > 0;

  return (
    <Card className="p-3">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="font-semibold text-sm">Quick record</h2>
          <p className="text-xs text-foreground/50">
            {hasProjects
              ? "Capture audio for a project"
              : "Create a project first to start recording"}
          </p>
        </div>
        <Button onClick={() => open()} disabled={!hasProjects} aria-label="Record">
          <Mic size={16} />
          Record
        </Button>
      </div>
    </Card>
  );
}
