"use client";

import { useEffect, useState } from "react";
import { FolderOpen, Plus, Loader2, Brain, Trash2, X } from "lucide-react";
import { api } from "@/lib/api";
import { Project, ProjectListResponse } from "./types";

const CONTEXT_PLACEHOLDER = `Describe your project so AI generates better tickets. Example:

App de e-commerce en Next.js con pagos Stripe. Equipo: Ana frontend, Luis backend. Usamos Tailwind, Prisma, PostgreSQL. Sprint actual enfocado en checkout y notificaciones.`;

export function ProjectList() {
  const [projects, setProjects] = useState<Project[]>([]);
  const [loading, setLoading] = useState(true);
  const [isCreating, setIsCreating] = useState(false);
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [context, setContext] = useState("");
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    fetchProjects();
  }, []);

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

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;

    setSaving(true);
    try {
      const project = await api.post<Project>("/projects", {
        name: name.trim(),
        description: description.trim() || undefined,
        context: context.trim() || undefined,
      });
      setProjects((prev) => [project, ...prev]);
      setIsCreating(false);
      setName("");
      setDescription("");
      setContext("");
    } catch {
      // handle error
    } finally {
      setSaving(false);
    }
  };

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
        <button
          onClick={() => setIsCreating(true)}
          className="flex items-center gap-1.5 bg-indigo-600 hover:bg-indigo-500 px-4 py-2 rounded-lg text-sm font-medium transition"
          aria-label="New project"
        >
          <Plus size={16} />
          New project
        </button>
      </div>

      {/* Create form */}
      {isCreating && (
        <form
          onSubmit={handleCreate}
          className="bg-zinc-900/50 border border-zinc-800 rounded-xl p-6 mb-6"
        >
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold">New Project</h2>
            <button
              type="button"
              onClick={() => setIsCreating(false)}
              className="text-zinc-500 hover:text-zinc-300"
            >
              <X size={18} />
            </button>
          </div>

          <div className="space-y-4">
            <div>
              <label
                htmlFor="project-name"
                className="block text-sm font-medium text-zinc-400 mb-1"
              >
                Name
              </label>
              <input
                id="project-name"
                type="text"
                required
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="My Project"
                className="w-full bg-zinc-900 border border-zinc-700 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-indigo-500 transition"
              />
            </div>

            <div>
              <label
                htmlFor="project-description"
                className="block text-sm font-medium text-zinc-400 mb-1"
              >
                Description
              </label>
              <input
                id="project-description"
                type="text"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Brief description of the project"
                className="w-full bg-zinc-900 border border-zinc-700 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-indigo-500 transition"
              />
            </div>

            <div>
              <label
                htmlFor="project-context"
                className="block text-sm font-medium text-zinc-400 mb-1"
              >
                <span className="flex items-center gap-1.5">
                  <Brain size={14} className="text-indigo-400" />
                  AI Context
                </span>
              </label>
              <textarea
                id="project-context"
                value={context}
                onChange={(e) => setContext(e.target.value)}
                placeholder={CONTEXT_PLACEHOLDER}
                rows={5}
                className="w-full bg-zinc-900 border border-zinc-700 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-indigo-500 transition resize-none"
              />
              <p className="text-xs text-zinc-500 mt-1">
                This context is injected into AI prompts when processing audio for this project.
              </p>
            </div>

            <button
              type="submit"
              disabled={saving || !name.trim()}
              className="bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 px-4 py-2 rounded-lg text-sm font-medium transition"
            >
              {saving ? "Creating..." : "Create project"}
            </button>
          </div>
        </form>
      )}

      {/* Project list */}
      {projects.length === 0 && !isCreating ? (
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
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium">{project.name}</p>
                  {project.description && (
                    <p className="text-xs text-zinc-500 mt-0.5">{project.description}</p>
                  )}
                </div>
                {project.context && (
                  <span className="flex items-center gap-1 text-xs text-indigo-400 bg-indigo-400/10 px-2 py-0.5 rounded">
                    <Brain size={12} />
                    AI context
                  </span>
                )}
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
