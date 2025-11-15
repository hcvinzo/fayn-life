/**
 * Permission system types
 */

import { Database } from "./database";

export type UserRole = Database["public"]["Enums"]["user_role"];

export interface Permission {
  id: string;
  code: PermissionCode;
  name: string;
  description: string | null;
  created_at: string;
  updated_at: string;
}

export interface RolePermission {
  id: string;
  role: UserRole;
  permission_id: string;
  created_at: string;
}

export interface PractitionerAssignment {
  id: string;
  assistant_id: string;
  practitioner_id: string;
  practice_id: string;
  created_at: string;
  created_by: string | null;
}

export interface AssignedPractitioner {
  id: string;
  full_name: string;
  email: string;
}

/**
 * Available permission codes in the system
 */
export type PermissionCode =
  | "manage_clients"
  | "manage_appointments"
  | "view_sessions"
  | "manage_sessions"
  | "view_medical_data"
  | "manage_availability"
  | "manage_practice_settings";

/**
 * Permission definitions
 */
export const PERMISSIONS = {
  MANAGE_CLIENTS: "manage_clients" as const,
  MANAGE_APPOINTMENTS: "manage_appointments" as const,
  VIEW_SESSIONS: "view_sessions" as const,
  MANAGE_SESSIONS: "manage_sessions" as const,
  VIEW_MEDICAL_DATA: "view_medical_data" as const,
  MANAGE_AVAILABILITY: "manage_availability" as const,
  MANAGE_PRACTICE_SETTINGS: "manage_practice_settings" as const,
} as const;

/**
 * Default permissions by role
 */
export const ROLE_PERMISSIONS: Record<UserRole, PermissionCode[]> = {
  admin: [
    PERMISSIONS.MANAGE_CLIENTS,
    PERMISSIONS.MANAGE_APPOINTMENTS,
    PERMISSIONS.VIEW_SESSIONS,
    PERMISSIONS.MANAGE_SESSIONS,
    PERMISSIONS.VIEW_MEDICAL_DATA,
    PERMISSIONS.MANAGE_AVAILABILITY,
    PERMISSIONS.MANAGE_PRACTICE_SETTINGS,
  ],
  practitioner: [
    PERMISSIONS.MANAGE_CLIENTS,
    PERMISSIONS.MANAGE_APPOINTMENTS,
    PERMISSIONS.VIEW_SESSIONS,
    PERMISSIONS.MANAGE_SESSIONS,
    PERMISSIONS.VIEW_MEDICAL_DATA,
    PERMISSIONS.MANAGE_AVAILABILITY,
  ],
  assistant: [PERMISSIONS.MANAGE_CLIENTS, PERMISSIONS.MANAGE_APPOINTMENTS],
  staff: [PERMISSIONS.MANAGE_CLIENTS, PERMISSIONS.MANAGE_APPOINTMENTS],
};

/**
 * Check if a role has a specific permission
 */
export function roleHasPermission(
  role: UserRole,
  permission: PermissionCode
): boolean {
  return ROLE_PERMISSIONS[role].includes(permission);
}

/**
 * Get all permissions for a role
 */
export function getRolePermissions(role: UserRole): PermissionCode[] {
  return ROLE_PERMISSIONS[role];
}
