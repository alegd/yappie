export interface Project {
  id: string;
  name: string;
  description: string | null;
  context: string | null;
  jiraProjectKey?: string;
  userId: string;
  createdAt: string;
  updatedAt: string;
  pendingTicketCount?: number;
}

export interface ProjectListResponse {
  data: Project[];
  total: number;
  page: number;
  limit: number;
}
