"use client";

import { OnboardingChecklist } from "@/features/audio/onboarding-checklist";
import type { ProjectListResponse } from "@/features/projects/types";
import { useQuery } from "@/hooks/use-query";
import { JIRA_STATUS, PROJECTS_LIST } from "@/lib/constants/endpoints";
import { ActivityFeed } from "./activity-feed";
import { QuickRecord } from "./quick-record";
import { QuotaWidget } from "./quota-widget";

interface JiraStatus {
  connected: boolean;
  siteName: string | null;
}

export function HomePage() {
  const { data: projectsData } = useQuery<ProjectListResponse>(PROJECTS_LIST);
  const { data: jiraStatus } = useQuery<JiraStatus>(JIRA_STATUS);

  const projects = projectsData?.data ?? [];
  const hasProjects = projects.length > 0;

  return (
    <div className="space-y-4">
      {hasProjects ? (
        <>
          <QuickRecord projects={projects} />
          <ActivityFeed />
        </>
      ) : (
        <OnboardingChecklist
          jiraConnected={jiraStatus?.connected ?? false}
          jiraSiteName={jiraStatus?.siteName ?? undefined}
          hasProjects={hasProjects}
        />
      )}
      <QuotaWidget />
    </div>
  );
}
