"use client";

import { AppSelect } from "@/components/ui/app-select";
import { Card } from "@/components/ui/card/Card";
import { AudioUpload } from "@/features/audio/audio-upload";
import type { AudioRecording } from "@/features/audio/types";
import { invalidateQuery } from "@/hooks/use-query";
import { ACTIVITY_FEED, audioByProject } from "@/lib/constants/endpoints";
import { useState } from "react";
import type { Project } from "@/features/projects/types";

interface QuickRecordProps {
  projects: Project[];
}

export function QuickRecord({ projects }: QuickRecordProps) {
  const [selected, setSelected] = useState<string>(projects[0]?.id ?? "");

  if (projects.length === 0) {
    return (
      <Card className="p-4">
        <p className="text-sm">Create a project first to start recording.</p>
      </Card>
    );
  }

  const handleUploaded = (_: AudioRecording) => {
    if (selected) invalidateQuery(audioByProject(selected));
    invalidateQuery(ACTIVITY_FEED);
  };

  return (
    <Card className="p-4">
      <h2 className="font-semibold text-sm mb-3">Quick record</h2>
      <div className="flex items-center gap-3">
        <AppSelect
          value={selected}
          onChange={setSelected}
          options={projects.map((p) => ({ value: p.id, label: p.name }))}
          placeholder="Select project"
          ariaLabel="Project"
        />
        <AudioUpload projectId={selected} onUploaded={handleUploaded} disabled={!selected} />
      </div>
    </Card>
  );
}
