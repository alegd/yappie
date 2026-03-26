export const API_URL = `${process.env.NEXT_PUBLIC_API_URL}/api`;

const API_V1 = "/v1";

// ─── Auth ────────────────────────────────────────────────
export const AUTH_REGISTER = "/auth/register";

// ─── Audio ───────────────────────────────────────────────
export const AUDIO_LIST = `${API_V1}/audio?limit=50`;
export const AUDIO_UPLOAD = `${API_V1}/audio/upload`;
export const audioDetail = (id: string) => `${API_V1}/audio/${id}`;
export const audioByProject = (projectId: string) =>
  `${API_V1}/audio?limit=50&projectId=${projectId}`;

// ─── Tickets ─────────────────────────────────────────────
export const TICKETS_LIST = `${API_V1}/tickets?limit=50`;
export const ticketDetail = (id: string) => `${API_V1}/tickets/${id}`;
export const ticketApprove = (id: string) => `${API_V1}/tickets/${id}/approve`;
export const ticketExport = (id: string, projectKey: string) =>
  `${API_V1}/integrations/jira/export/${id}?projectKey=${projectKey}`;
export const TICKETS_EXPORT_BULK = `${API_V1}/integrations/jira/export-bulk`;

// ─── Projects ────────────────────────────────────────────
export const PROJECTS_LIST = `${API_V1}/projects?limit=50`;
export const PROJECTS_CREATE = `${API_V1}/projects`;
export const projectDetail = (id: string) => `${API_V1}/projects/${id}`;

// ─── Templates ───────────────────────────────────────────
export const TEMPLATES_LIST = `${API_V1}/templates`;
export const TEMPLATES_CREATE = `${API_V1}/templates`;
export const templateDetail = (id: string) => `${API_V1}/templates/${id}`;

// ─── Analytics ───────────────────────────────────────────
export const analyticsOverview = (from: string, to: string) =>
  `${API_V1}/analytics/overview?from=${from}&to=${to}`;

// ─── Quotas ─────────────────────────────────────────────
export const QUOTAS = `${API_V1}/quotas`;

// ─── Integrations — Jira ─────────────────────────────────
export const JIRA_STATUS = `${API_V1}/integrations/jira/status`;
export const JIRA_AUTH = `${API_V1}/integrations/jira/auth`;
export const JIRA_PROJECTS = `${API_V1}/integrations/jira/projects`;
export const JIRA_DISCONNECT = `${API_V1}/integrations/jira`;
