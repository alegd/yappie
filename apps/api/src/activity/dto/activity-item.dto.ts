export interface ActivityItemDto {
  type: "audio.uploaded" | "audio.completed" | "ticket.exported";
  audioId?: string;
  ticketId?: string;
  fileName?: string;
  ticketTitle?: string;
  ticketCount?: number;
  jiraIssueKey?: string;
  jiraIssueUrl?: string | null;
  projectId: string | null;
  projectName: string | null;
  at: string;
}
