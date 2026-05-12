export const queryKeys = {
  projects: ["projects"] as const,
  project: (id: string) => ["projects", id] as const,
  projectAudios: (projectId: string) => ["audios", { projectId }] as const,
  recentAudios: ["audios", "recent"] as const,
  audio: (id: string) => ["audios", id] as const,
  quota: ["quotas"] as const,
  jiraStatus: ["jira", "status"] as const,
};
