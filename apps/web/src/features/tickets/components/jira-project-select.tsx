"use client";

import { AppSelect } from "@/components/ui/app-select";
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
      <AppSelect
        value=""
        onChange={() => {}}
        options={[]}
        placeholder="Loading..."
        disabled
        ariaLabel="Jira project"
      />
    );
  }

  if (!projects?.length) {
    return (
      <AppSelect
        value=""
        onChange={() => {}}
        options={[]}
        placeholder="No projects"
        disabled
        ariaLabel="Jira project"
      />
    );
  }

  const options = projects.map((p) => ({
    value: p.key,
    label: `${p.key} — ${p.name}`,
  }));

  return (
    <AppSelect
      value={value}
      onChange={onChange}
      options={options}
      placeholder="Select project"
      disabled={disabled}
      ariaLabel="Jira project"
    />
  );
}
