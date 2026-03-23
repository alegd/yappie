// ─── Auth ────────────────────────────────────────────────
export const AUTH_REGISTER = "/auth/register";

// ─── Audio ───────────────────────────────────────────────
export const AUDIO_LIST = "/audio?limit=50";
export const AUDIO_UPLOAD = "/audio/upload";
export const audioDetail = (id: string) => `/audio/${id}`;
export const audioByProject = (projectId: string) => `/audio?limit=50&projectId=${projectId}`;

// ─── Tickets ─────────────────────────────────────────────
export const TICKETS_LIST = "/tickets?limit=50";
export const ticketDetail = (id: string) => `/tickets/${id}`;
export const ticketApprove = (id: string) => `/tickets/${id}/approve`;
export const ticketExport = (id: string, projectKey: string) =>
  `/integrations/jira/export/${id}?projectKey=${projectKey}`;
export const TICKETS_EXPORT_BULK = "/integrations/jira/export-bulk";

// ─── Projects ────────────────────────────────────────────
export const PROJECTS_LIST = "/projects?limit=50";
export const PROJECTS_CREATE = "/projects";
export const projectDetail = (id: string) => `/projects/${id}`;

// ─── Templates ───────────────────────────────────────────
export const TEMPLATES_LIST = "/templates";
export const TEMPLATES_CREATE = "/templates";
export const templateDetail = (id: string) => `/templates/${id}`;

// ─── Analytics ───────────────────────────────────────────
export const analyticsOverview = (from: string, to: string) =>
  `/analytics/overview?from=${from}&to=${to}`;

// ─── Integrations — Jira ─────────────────────────────────
export const JIRA_STATUS = "/integrations/jira/status";
export const JIRA_AUTH = "/integrations/jira/auth";
export const JIRA_DISCONNECT = "/integrations/jira";
