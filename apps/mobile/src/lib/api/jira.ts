import { apiFetch } from "./client";

export interface JiraExportResult {
  jiraIssueKey: string;
  jiraIssueUrl: string;
}

export interface JiraStatus {
  connected: boolean;
}

export function exportTicketToJira(ticketId: string): Promise<JiraExportResult> {
  return apiFetch<JiraExportResult>(`/integrations/jira/export/${ticketId}`, {
    method: "POST",
  });
}

export function exportTicketsBulk(ticketIds: string[]): Promise<unknown> {
  return apiFetch<unknown>(`/integrations/jira/export-bulk`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ ticketIds }),
  });
}

export function getJiraStatus(): Promise<JiraStatus> {
  return apiFetch<JiraStatus>(`/integrations/jira/status`);
}

export interface JiraAuthStart {
  url: string;
}

export function startJiraAuth(returnPath?: string): Promise<JiraAuthStart> {
  const path = returnPath
    ? `/integrations/jira/auth?returnPath=${encodeURIComponent(returnPath)}`
    : `/integrations/jira/auth`;
  return apiFetch<JiraAuthStart>(path);
}

export function disconnectJira(): Promise<void> {
  return apiFetch<void>(`/integrations/jira`, { method: "DELETE" });
}
