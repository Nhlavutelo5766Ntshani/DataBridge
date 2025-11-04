/**
 * Application path constants
 * Centralized path definitions for consistent routing
 */

export const PATHS = {
  PUBLIC: {
    HOME: "/",
    LOGIN: "/login",
    SIGNUP: "/signup",
    ERROR: "/error",
  },
  DASHBOARD: {
    HOME: "/dashboard",
    CONNECTIONS: "/connections",
    CONNECTIONS_NEW: "/connections/new",
    PROJECTS: "/projects",
    PROJECTS_NEW: "/projects/new",
    PROJECT_DETAIL: (id: string) => `/projects/${id}`,
    PROJECT_MAPPING: (id: string) => `/projects/${id}/mapping`,
    PROJECT_TRANSFORM: (id: string) => `/projects/${id}/transform`,
    PROJECT_EXECUTE: (id: string) => `/projects/${id}/execute`,
    MIGRATIONS: "/migrations",
    MIGRATION_DETAIL: (id: string) => `/migrations/${id}`,
    REPORTS: "/reports",
    REPORT_DETAIL: (id: string) => `/reports/${id}`,
    SETTINGS: "/settings",
    SETTINGS_PROFILE: "/settings/profile",
    SETTINGS_TEAM: "/settings/team",
    SETTINGS_API: "/settings/api",
  },
} as const;

