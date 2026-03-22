// ─── Audio ───────────────────────────────────────────────
export const AUDIO_LIST = "/audio?limit=50";
export const AUDIO_UPLOAD = "/audio/upload";
export const audioDetail = (id: string) => `/audio/${id}`;
export const audioByProject = (projectId: string) => `/audio?limit=50&projectId=${projectId}`;

// ─── Tickets ─────────────────────────────────────────────
export const TICKETS_LIST = "/tickets?limit=50";

// ─── Projects ────────────────────────────────────────────
export const PROJECTS_LIST = "/projects?limit=50";
export const PROJECTS_CREATE = "/projects";
export const projectDetail = (id: string) => `/projects/${id}`;

// ─── Templates ───────────────────────────────────────────
export const TEMPLATES_LIST = "/templates";

// ─── Analytics ───────────────────────────────────────────
export const analyticsOverview = (from: string, to: string) =>
  `/analytics/overview?from=${from}&to=${to}`;

// ─── Integrations — Jira ─────────────────────────────────
export const JIRA_STATUS = "/integrations/jira/status";
export const JIRA_AUTH = "/integrations/jira/auth";
export const JIRA_DISCONNECT = "/integrations/jira";
