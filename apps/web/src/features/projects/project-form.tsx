"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { ArrowLeft, Brain, Loader2 } from "lucide-react";
import Link from "next/link";
import { api } from "@/lib/api";
import { Project } from "./types";

const CONTEXT_PLACEHOLDER = `Describe your project so AI generates better tickets. Example:

App de e-commerce en Next.js con pagos Stripe. Equipo: Ana frontend, Luis backend. Usamos Tailwind, Prisma, PostgreSQL. Sprint actual enfocado en checkout y notificaciones.`;

interface ProjectFormProps {
  projectId?: string;
}

export function ProjectForm({ projectId }: ProjectFormProps) {
  const router = useRouter();
  const isEditing = !!projectId;

  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [context, setContext] = useState("");
  const [saving, setSaving] = useState(false);
  const [loading, setLoading] = useState(isEditing);
  const [error, setError] = useState("");

  useEffect(() => {
    if (!projectId) return;

    const fetchProject = async () => {
      try {
        const project = await api.get<Project>(`/projects/${projectId}`);
        setName(project.name);
        setDescription(project.description || "");
        setContext(project.context || "");
      } catch {
        setError("Project not found");
      } finally {
        setLoading(false);
      }
    };
    fetchProject();
  }, [projectId]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;

    setSaving(true);
    setError("");

    try {
      const body = {
        name: name.trim(),
        description: description.trim() || undefined,
        context: context.trim() || undefined,
      };

      if (isEditing) {
        await api.patch(`/projects/${projectId}`, body);
      } else {
        await api.post("/projects", body);
      }

      router.push("/dashboard/projects");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to save project");
    } finally {
      setSaving(false);
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
    <div className="max-w-2xl">
      <div className="flex items-center gap-4 mb-6">
        <Link href="/dashboard/projects" className="text-zinc-500 hover:text-zinc-300 transition">
          <ArrowLeft size={20} />
        </Link>
        <h1 className="text-2xl font-bold">{isEditing ? "Edit Project" : "New Project"}</h1>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        {error && (
          <div className="bg-red-500/10 border border-red-500/20 text-red-400 text-sm rounded-lg p-3">
            {error}
          </div>
        )}

        <div>
          <label htmlFor="name" className="block text-sm font-medium text-zinc-400 mb-1">
            Name
          </label>
          <input
            id="name"
            type="text"
            required
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="My Project"
            className="w-full bg-zinc-900 border border-zinc-700 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-indigo-500 transition"
          />
        </div>

        <div>
          <label htmlFor="description" className="block text-sm font-medium text-zinc-400 mb-1">
            Description
          </label>
          <input
            id="description"
            type="text"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="Brief description of the project"
            className="w-full bg-zinc-900 border border-zinc-700 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-indigo-500 transition"
          />
        </div>

        <div>
          <label htmlFor="context" className="block text-sm font-medium text-zinc-400 mb-1">
            <span className="flex items-center gap-1.5">
              <Brain size={14} className="text-indigo-400" />
              AI Context
            </span>
          </label>
          <textarea
            id="context"
            value={context}
            onChange={(e) => setContext(e.target.value)}
            placeholder={CONTEXT_PLACEHOLDER}
            rows={8}
            className="w-full bg-zinc-900 border border-zinc-700 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-indigo-500 transition resize-none"
          />
          <p className="text-xs text-zinc-500 mt-1">
            This context is injected into AI prompts when processing audio for this project. The
            more specific you are, the better the generated tickets will be.
          </p>
        </div>

        <div className="flex gap-3">
          <button
            type="submit"
            disabled={saving || !name.trim()}
            className="bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 px-6 py-2 rounded-lg text-sm font-medium transition"
          >
            {saving ? "Saving..." : isEditing ? "Save changes" : "Create project"}
          </button>
          <Link
            href="/dashboard/projects"
            className="bg-zinc-800 hover:bg-zinc-700 px-6 py-2 rounded-lg text-sm font-medium transition"
          >
            Cancel
          </Link>
        </div>
      </form>
    </div>
  );
}
