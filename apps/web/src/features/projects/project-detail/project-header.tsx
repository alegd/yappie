"use client";

import { Pencil } from "lucide-react";
import Link from "next/link";
import { AudioUpload } from "@/features/audio/audio-upload";
import type { AudioRecording } from "@/features/audio/types";
import type { Project } from "@/features/projects/types";
import { editProjectPage } from "@/lib/constants/pages";

interface ProjectHeaderProps {
  project: Project;
  onUploaded: (recording: AudioRecording) => void;
}

export function ProjectHeader({ project, onUploaded }: ProjectHeaderProps) {
  return (
    <div className="flex items-start justify-between gap-4 mb-6">
      <div className="min-w-0">
        <h1 className="font-bold text-2xl truncate">{project.name}</h1>
        {project.description && (
          <p className="mt-1 text-muted-foreground text-sm">{project.description}</p>
        )}
        <Link
          href={editProjectPage(project.id)}
          className="inline-flex items-center gap-1 mt-2 text-accent text-xs hover:underline"
        >
          <Pencil size={12} />
          Edit context
        </Link>
      </div>
      <div className="shrink-0">
        <AudioUpload projectId={project.id} onUploaded={onUploaded} />
      </div>
    </div>
  );
}
