"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { FolderOpen, Plus, Loader2, Brain, Trash2, Pencil } from "lucide-react";
import { api } from "@/lib/api";
import { Project, ProjectListResponse } from "./types";

export function ProjectList() {
  const [projects, setProjects] = useState<Project[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchProjects = async () => {
      try {
        const data = await api.get<ProjectListResponse>("/projects?limit=50");
        setProjects(data.data);
      } catch {
        // silently fail
      } finally {
        setLoading(false);
      }
    };
    fetchProjects();
  }, []);

  const handleDelete = async (id: string) => {
    if (!confirm("Are you sure you want to delete this project?")) return;

    try {
      await api.delete(`/projects/${id}`);
      setProjects((prev) => prev.filter((p) => p.id !== id));
    } catch {
      // handle error
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 size={24} className="animate-spin text-zinc-500" />
        <span className="ml-2 text-zinc-500">Loading...</span>
      </div>
    );
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold">Projects</h1>
        <Link
          href="/dashboard/projects/new"
          className="flex items-center gap-1.5 bg-indigo-600 hover:bg-indigo-500 px-4 py-2 rounded-lg text-sm font-medium transition"
          aria-label="New project"
        >
          <Plus size={16} />
          New project
        </Link>
      </div>

      {projects.length === 0 ? (
        <div className="text-center py-20 text-zinc-500">
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
              className="bg-zinc-900/50 border border-zinc-800 rounded-lg p-4 hover:border-zinc-700 transition"
            >
              <div className="flex items-center gap-3">
                <FolderOpen size={18} className="text-zinc-500 shrink-0" />
                <Link href={`/dashboard/projects/${project.id}/edit`} className="flex-1 min-w-0">
                  <p className="text-sm font-medium hover:text-indigo-400 transition">
                    {project.name}
                  </p>
                  {project.description && (
                    <p className="text-xs text-zinc-500 mt-0.5">{project.description}</p>
                  )}
                </Link>
                {project.context && (
                  <span className="flex items-center gap-1 text-xs text-indigo-400 bg-indigo-400/10 px-2 py-0.5 rounded">
                    <Brain size={12} />
                    AI context
                  </span>
                )}
                <Link
                  href={`/dashboard/projects/${project.id}/edit`}
                  className="text-zinc-600 hover:text-indigo-400 transition"
                  aria-label={`Edit ${project.name}`}
                >
                  <Pencil size={14} />
                </Link>
                <button
                  onClick={() => handleDelete(project.id)}
                  className="text-zinc-600 hover:text-red-400 transition"
                  aria-label={`Delete ${project.name}`}
                >
                  <Trash2 size={14} />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
