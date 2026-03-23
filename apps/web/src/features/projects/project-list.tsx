"use client";

import Link from "next/link";
import { FolderOpen, Plus, Loader2, Brain, Trash2, Pencil } from "lucide-react";
import { Button } from "@/components/ui/button";
import { api } from "@/lib/api";
import { useQuery, invalidateQuery } from "@/hooks/use-query";
import { PROJECTS_LIST, projectDetail } from "@/lib/constants/endpoints";
import { NEW_PROJECT_PAGE, editProjectPage } from "@/lib/constants/pages";
import { ProjectListResponse } from "./types";

export function ProjectList() {
  const { data: projectData, isLoading } = useQuery<ProjectListResponse>(PROJECTS_LIST);

  const projects = projectData?.data ?? [];

  const handleDelete = async (id: string) => {
    if (!confirm("Are you sure you want to delete this project?")) return;

    try {
      await api.delete(projectDetail(id));
      invalidateQuery(PROJECTS_LIST);
    } catch {
      // handle error
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 size={24} className="animate-spin text-muted-foreground" />
        <span className="ml-2 text-muted-foreground">Loading...</span>
      </div>
    );
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold">Projects</h1>
        <Link
          href={NEW_PROJECT_PAGE}
          className="flex items-center gap-1.5 bg-primary hover:bg-primary-hover px-4 py-2 rounded-lg text-sm font-medium transition"
          aria-label="New project"
        >
          <Plus size={16} />
          New project
        </Link>
      </div>

      {projects.length === 0 ? (
        <div className="text-center py-20 text-muted-foreground">
          <FolderOpen size={48} className="mx-auto mb-4 opacity-50" />
          <p>No projects yet.</p>
          <p className="text-sm mt-1">
            Create a project to give AI context for better ticket generation.
          </p>
        </div>
      ) : (
        <div className="space-y-2">
          {projects.map((project) => (
            <div
              key={project.id}
              className="bg-surface/50 border border-border rounded-lg p-4 hover:border-border-hover transition"
            >
              <div className="flex items-center gap-3">
                <FolderOpen size={18} className="text-muted-foreground shrink-0" />
                <Link href={editProjectPage(project.id)} className="flex-1 min-w-0">
                  <p className="text-sm font-medium hover:text-accent transition">{project.name}</p>
                  {project.description && (
                    <p className="text-xs text-muted-foreground mt-0.5">{project.description}</p>
                  )}
                </Link>
                {project.context && (
                  <span className="flex items-center gap-1 text-xs text-accent bg-accent-surface px-2 py-0.5 rounded">
                    <Brain size={12} />
                    AI context
                  </span>
                )}
                <Link
                  href={editProjectPage(project.id)}
                  className="text-muted-foreground hover:text-accent transition"
                  aria-label={`Edit ${project.name}`}
                >
                  <Pencil size={14} />
                </Link>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => handleDelete(project.id)}
                  className="hover:text-red-400"
                  aria-label={`Delete ${project.name}`}
                >
                  <Trash2 size={14} />
                </Button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
