// ─── Public ──────────────────────────────────────────────
export const HOME_PAGE = "/";
export const LOGIN_PAGE = "/login";
export const REGISTER_PAGE = "/register";
export const LOGOUT_PAGE = "/logout";
// ─── Dashboard ───────────────────────────────────────────
export const DASHBOARD_PAGE = "/dashboard";
export const AUDIOS_PAGE = "/dashboard/audios";
export const TICKETS_PAGE = "/dashboard/tickets";
export const PROJECTS_PAGE = "/dashboard/projects";
export const ANALYTICS_PAGE = "/dashboard/analytics";
export const SETTINGS_PAGE = "/dashboard/settings";
export const NEW_PROJECT_PAGE = "/dashboard/projects/new";

export const audioDetailPage = (id: string) => `/dashboard/audios/${id}`;
export const ticketDetailPage = (id: string) => `/dashboard/tickets/${id}`;
export const editProjectPage = (id: string) => `/dashboard/projects/${id}/edit`;
