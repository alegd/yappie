export interface Project {
  id: string;
  name: string;
  description: string | null;
  context: string | null;
  userId: string;
  createdAt: string;
  updatedAt: string;
}

export interface ProjectListResponse {
  data: Project[];
  total: number;
  page: number;
  limit: number;
}
