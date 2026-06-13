// ─── Public ──────────────────────────────────────────────
export const HOME_PAGE = "/";
export const AUTH_PAGE = "/auth";
export const LOGOUT_PAGE = "/logout";
export const DELETE_ACCOUNT_REQUEST_PAGE = "/delete-account-request";
// ─── Dashboard ───────────────────────────────────────────
export const DASHBOARD_PAGE = "/dashboard";
export const AUDIOS_PAGE = "/dashboard/audios";
export const TICKETS_PAGE = "/dashboard/tickets";
export const PROJECTS_PAGE = "/dashboard/projects";
export const ANALYTICS_PAGE = "/dashboard/analytics";
export const SETTINGS_PAGE = "/dashboard/settings";
export const NEW_PROJECT_PAGE = "/dashboard/projects/new";
export const DELETE_ACCOUNT_PAGE = "/dashboard/account/delete";

export const audioDetailPage = (id: string) => `/dashboard/audio/${id}`;
export const ticketDetailPage = (id: string) => `/dashboard/tickets/${id}`;
export const editProjectPage = (id: string) => `/dashboard/projects/${id}/edit`;
export const projectDetailPage = (id: string) => `/dashboard/projects/${id}`;
