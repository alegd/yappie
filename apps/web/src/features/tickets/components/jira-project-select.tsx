"use client";

import { useQuery } from "@/hooks/use-query";
import { JIRA_PROJECTS } from "@/lib/constants/endpoints";

interface JiraProject {
  id: string;
  key: string;
  name: string;
}

interface JiraProjectSelectProps {
  value: string;
  onChange: (key: string) => void;
  disabled?: boolean;
}

export function JiraProjectSelect({ value, onChange, disabled }: JiraProjectSelectProps) {
  const { data: projects, isLoading } = useQuery<JiraProject[]>(JIRA_PROJECTS);

  if (isLoading) {
    return (
      <select
        disabled
        className="bg-surface opacity-50 px-3 py-1.5 border border-border-hover rounded-lg text-sm"
      >
        <option>Loading...</option>
      </select>
    );
  }

  if (!projects?.length) {
    return (
      <select
        disabled
        className="bg-surface opacity-50 px-3 py-1.5 border border-border-hover rounded-lg text-sm"
      >
        <option>No projects</option>
      </select>
    );
  }

  return (
    <select
      value={value}
      onChange={(e) => onChange(e.target.value)}
      disabled={disabled}
      className="bg-surface px-3 py-1.5 border border-border-hover focus:border-primary rounded-lg focus:outline-none text-sm transition"
      aria-label="Jira project"
    >
      <option value="">Select project</option>
      {projects.map((p) => (
        <option key={p.id} value={p.key}>
          {p.key} — {p.name}
        </option>
      ))}
    </select>
  );
}
