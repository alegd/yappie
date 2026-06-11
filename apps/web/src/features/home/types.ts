export type ActivityItem =
  | {
      type: "audio.uploaded";
      audioId: string;
      fileName: string;
      projectId: string | null;
      projectName: string | null;
      at: string;
    }
  | {
      type: "audio.completed";
      audioId: string;
      fileName: string;
      ticketCount: number;
      projectId: string | null;
      projectName: string | null;
      at: string;
    }
  | {
      type: "ticket.exported";
      ticketId: string;
      ticketTitle: string;
      jiraIssueKey: string;
      jiraIssueUrl: string | null;
      projectId: string | null;
      projectName: string | null;
      at: string;
    };

export interface ActivityResponse {
  data: ActivityItem[];
  total: number;
}
