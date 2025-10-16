/**
 * Application-wide constants
 */

export const APP_NAME = "fayn.life";
export const APP_DESCRIPTION = "Practice Management Platform";

export const ROUTES = {
  HOME: "/",
  LOGIN: "/login",
  REGISTER: "/register",
  DASHBOARD: "/dashboard",
  CLIENTS: "/clients",
  APPOINTMENTS: "/appointments",
  CALENDAR: "/calendar",
  SETTINGS: "/settings",
  ADMIN: "/admin",
} as const;

export const USER_ROLES = {
  ADMIN: "admin",
  PRACTITIONER: "practitioner",
  STAFF: "staff",
} as const;

export const APPOINTMENT_STATUS = {
  SCHEDULED: "scheduled",
  CONFIRMED: "confirmed",
  COMPLETED: "completed",
  CANCELLED: "cancelled",
  NO_SHOW: "no_show",
} as const;

export const CLIENT_STATUS = {
  ACTIVE: "active",
  INACTIVE: "inactive",
  ARCHIVED: "archived",
} as const;
