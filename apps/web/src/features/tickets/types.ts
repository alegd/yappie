export interface Ticket {
  id: string;
  title: string;
  description: string;
  status: "DRAFT" | "APPROVED" | "EXPORTED" | "REJECTED";
  priority: "LOW" | "MEDIUM" | "HIGH" | "CRITICAL";
  jiraIssueKey: string | null;
  jiraIssueUrl: string | null;
  audioRecordingId: string;
  projectId: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface TicketListResponse {
  data: Ticket[];
  total: number;
  page: number;
  limit: number;
}
