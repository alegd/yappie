"use client";

import { Button } from "@/components/ui/button";
import { useQuery } from "@/hooks/use-query";
import { projectDetail } from "@/lib/constants/endpoints";
import { PROJECTS_PAGE } from "@/lib/constants/pages";
import { zodResolver } from "@hookform/resolvers/zod";
import { ArrowLeft, Loader2 } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect } from "react";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { useCreateProject, useUpdateProject } from "./hooks/useProjects";
import { Project } from "./types";

const projectSchema = z.object({
  name: z.string().min(1, "Name is required").max(100),
  description: z.string().max(500).optional(),
  context: z.string().max(5000).optional(),
});

type ProjectFormData = z.infer<typeof projectSchema>;

const CONTEXT_PLACEHOLDER = `Describe your project so AI generates better tickets. Example:

App de e-commerce en Next.js con pagos Stripe. Equipo: Ana frontend, Luis backend. Usamos Tailwind, Prisma, PostgreSQL. Sprint actual enfocado en checkout y notificaciones.`;

interface ProjectFormProps {
  projectId?: string;
}

export function ProjectForm({ projectId }: ProjectFormProps) {
  const router = useRouter();
  const isEditing = !!projectId;

  const { data: project, isLoading } = useQuery<Project>(
    isEditing ? projectDetail(projectId) : null,
  );

  const { mutate: createProject, isPending: creating } = useCreateProject();
  const { mutate: updateProject, isPending: updating } = useUpdateProject(projectId ?? "");

  const saving = creating || updating;

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<ProjectFormData>({
    resolver: zodResolver(projectSchema),
    defaultValues: { name: "", description: "", context: "" },
  });

  useEffect(() => {
    if (project) {
      reset({
        name: project.name,
        description: project.description ?? "",
        context: project.context ?? "",
      });
    }
  }, [project, reset]);

  const onSubmit = async (data: ProjectFormData) => {
    const body = {
      name: data.name.trim(),
      description: data.description?.trim() || undefined,
      context: data.context?.trim() || undefined,
    };

    if (isEditing) {
      await updateProject(body);
    } else {
      await createProject(body);
    }

    router.push(PROJECTS_PAGE);
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
    <div className="max-w-2xl mx-auto">
      <div className="flex items-center gap-4 mb-6">
        <Link
          href={PROJECTS_PAGE}
          className="text-muted-foreground hover:text-foreground transition"
        >
          <ArrowLeft size={20} />
        </Link>
        <h1 className="font-bold text-2xl">{isEditing ? "Edit Project" : "New Project"}</h1>
      </div>

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
        <div>
          <label htmlFor="name" className="block mb-1.5 font-medium text-foreground/75 text-sm">
            Name
          </label>
          <input
            id="name"
            type="text"
            {...register("name")}
            placeholder="My Project"
            className="bg-surface px-3 py-2 border border-border-hover focus:border-primary rounded-lg focus:outline-none w-full transition"
          />
          {errors.name && <p className="mt-1 text-red-400 text-xs">{errors.name.message}</p>}
        </div>

        <div>
          <label
            htmlFor="description"
            className="block mb-1.5 font-medium text-foreground/75 text-sm"
          >
            Description
          </label>
          <input
            id="description"
            type="text"
            {...register("description")}
            placeholder="Brief description of the project"
            className="bg-surface px-3 py-2 border border-border-hover focus:border-primary rounded-lg focus:outline-none w-full transition"
          />
          {errors.description && (
            <p className="mt-1 text-red-400 text-xs">{errors.description.message}</p>
          )}
        </div>

        <div>
          <label htmlFor="context" className="block mb-1.5 font-medium text-foreground/75 text-sm">
            <span className="flex items-center gap-1.5">AI Context</span>
          </label>
          <textarea
            id="context"
            {...register("context")}
            placeholder={CONTEXT_PLACEHOLDER}
            rows={8}
            className="bg-surface px-3 py-2 border border-border-hover focus:border-primary rounded-lg focus:outline-none w-full transition resize-none"
          />
          {errors.context && <p className="mt-1 text-red-400 text-sm">{errors.context.message}</p>}
          <p className="mt-1 text-text-foreground/50 text-sm">
            This context is injected into AI prompts when processing audio for this project. The
            more specific you are, the better the generated tickets will be.
          </p>
        </div>

        <div className="flex gap-3">
          <Button type="submit" disabled={saving}>
            {saving ? "Saving..." : isEditing ? "Save changes" : "Create project"}
          </Button>
          <Link
            href={PROJECTS_PAGE}
            className="bg-surface-hover hover:bg-surface-hover px-6 py-2 rounded-lg font-medium transition"
          >
            Cancel
          </Link>
        </div>
      </form>
    </div>
  );
}
