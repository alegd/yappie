export type AudioStatus = "PENDING" | "TRANSCRIBING" | "ANALYZING" | "COMPLETED" | "FAILED";

export type TicketStatus = "DRAFT" | "APPROVED" | "EXPORTED" | "REJECTED";

export type TicketPriority = "LOW" | "MEDIUM" | "HIGH" | "CRITICAL";

export type Plan = "FREE" | "PRO";

export interface Project {
  id: string;
  name: string;
  description: string | null;
  context: string | null;
  jiraProjectKey: string | null;
  userId: string;
  createdAt: string;
  updatedAt: string;
}

export interface AudioRecording {
  id: string;
  fileName: string;
  fileSize: number;
  mimeType: string;
  duration: number | null;
  status: AudioStatus;
  transcription: string | null;
  errorMessage: string | null;
  projectId: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface Ticket {
  id: string;
  title: string;
  description: string;
  status: TicketStatus;
  priority: TicketPriority;
  jiraIssueKey: string | null;
  jiraIssueUrl: string | null;
  audioRecordingId: string;
  projectId: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface AudioRecordingWithTickets extends AudioRecording {
  tickets: Ticket[];
}

export interface Quota {
  plan: Plan;
  limitMinutes: number;
  usedMinutes: number;
  remainingMinutes: number;
  cycleStartDate: string;
  cycleEndDate: string;
}

export interface Paginated<T> {
  data: T[];
  total: number;
  page: number;
  limit: number;
}

export interface CreateProjectInput {
  name: string;
  description?: string;
}

export interface UpdateProjectInput {
  name?: string;
  description?: string;
  context?: string;
  jiraProjectKey?: string;
}

export interface UpdateTicketInput {
  title?: string;
  description?: string;
  priority?: TicketPriority;
  status?: TicketStatus;
}
