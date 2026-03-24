"use client";

import { Button } from "@/components/ui/button";
import { invalidateQuery, useQuery } from "@/hooks/use-query";
import { apiFetcher } from "@/lib/api-fetcher";
import { PROJECTS_LIST, projectDetail } from "@/lib/constants/endpoints";
import { DELETE } from "@/lib/constants/http";
import { NEW_PROJECT_PAGE, editProjectPage } from "@/lib/constants/pages";
import { Brain, FolderOpen, Loader2, Pencil, Plus, Trash2 } from "lucide-react";
import Link from "next/link";
import { ProjectListResponse } from "./types";

export function ProjectList() {
  const { data: projectData, isLoading } = useQuery<ProjectListResponse>(PROJECTS_LIST);

  const projects = projectData?.data ?? [];

  const handleDelete = async (id: string) => {
    if (!confirm("Are you sure you want to delete this project?")) return;

    try {
      await apiFetcher(projectDetail(id), { method: DELETE });
      invalidateQuery(PROJECTS_LIST);
    } catch {
      // handle error
    }
  };

  if (isLoading) {
    return (
      <div className="flex justify-center items-center py-20">
        <Loader2 size={24} className="text-muted-foreground animate-spin" />
        <span className="ml-2 text-muted-foreground">Loading...</span>
      </div>
    );
  }

  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <h1 className="font-bold text-2xl">Projects</h1>
        <Link
          href={NEW_PROJECT_PAGE}
          className="flex items-center gap-1.5 bg-primary hover:bg-primary-hover px-4 py-2 rounded-lg font-medium text-white text-sm transition"
          aria-label="New project"
        >
          <Plus size={16} />
          New project
        </Link>
      </div>

      {projects.length === 0 ? (
        <div className="py-20 text-muted-foreground text-center">
          <FolderOpen size={48} className="opacity-50 mx-auto mb-4" />
          <p>No projects yet.</p>
          <p className="mt-1 text-sm">
            Create a project to give AI context for better ticket generation.
          </p>
        </div>
      ) : (
        <div className="space-y-3">
          {projects.map((project) => (
            <div
              key={project.id}
              className="bg-background p-4 border border-border hover:border-border-hover rounded-lg transition"
            >
              <div className="flex items-center gap-3">
                <FolderOpen size={18} className="text-muted-foreground shrink-0" />
                <Link href={editProjectPage(project.id)} className="flex-1 min-w-0">
                  <p className="font-medium hover:text-accent transition">{project.name}</p>
                  {project.description && (
                    <p className="mt-0.5 text-foreground/75 text-sm">{project.description}</p>
                  )}
                </Link>
                {project.context && (
                  <span className="flex items-center gap-1 px-2 py-0.5 rounded text-accent text-xs bg-accent-surface">
                    <Brain size={12} />
                    AI context
                  </span>
                )}
                <Link
                  href={editProjectPage(project.id)}
                  className="text-foreground/75 hover:text-accent transition"
                  aria-label={`Edit ${project.name}`}
                >
                  <Pencil size={16} />
                </Link>
                <Button
                  variant="ghost"
                  onClick={() => handleDelete(project.id)}
                  className="hover:text-red-400"
                  aria-label={`Delete ${project.name}`}
                >
                  <Trash2 size={16} />
                </Button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
