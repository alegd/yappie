import { apiFetch } from "./client";
import type { CreateProjectInput, Paginated, Project, UpdateProjectInput } from "./types";

export function listProjects(page = 1, limit = 50): Promise<Paginated<Project>> {
  return apiFetch<Paginated<Project>>(`/projects?page=${page}&limit=${limit}`);
}

export function getProject(id: string): Promise<Project> {
  return apiFetch<Project>(`/projects/${id}`);
}

export function createProject(data: CreateProjectInput): Promise<Project> {
  return apiFetch<Project>("/projects", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(data),
  });
}

export function updateProject(id: string, data: UpdateProjectInput): Promise<Project> {
  return apiFetch<Project>(`/projects/${id}`, {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(data),
  });
}
