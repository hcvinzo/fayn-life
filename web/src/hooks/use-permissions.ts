"use client";

import { useAuth } from "./use-auth";
import {
  PermissionCode,
  UserRole,
  roleHasPermission,
  PERMISSIONS,
} from "@/types/permission";

/**
 * Hook for checking user permissions client-side
 *
 * Usage:
 * ```tsx
 * const { hasPermission, canManageClients, isAdmin, role } = usePermissions();
 *
 * if (canManageClients) {
 *   // Show client management UI
 * }
 * ```
 */
export function usePermissions() {
  const { profile, isLoading } = useAuth();

  const role: UserRole | null = profile?.role || null;

  /**
   * Check if user has a specific permission
   */
  const hasPermission = (permission: PermissionCode): boolean => {
    if (!role) return false;
    return roleHasPermission(role, permission);
  };

  /**
   * Permission checkers
   */
  const canManageClients = hasPermission(PERMISSIONS.MANAGE_CLIENTS);
  const canManageAppointments = hasPermission(PERMISSIONS.MANAGE_APPOINTMENTS);
  const canViewSessions = hasPermission(PERMISSIONS.VIEW_SESSIONS);
  const canManageSessions = hasPermission(PERMISSIONS.MANAGE_SESSIONS);
  const canViewMedicalData = hasPermission(PERMISSIONS.VIEW_MEDICAL_DATA);
  const canManageAvailability = hasPermission(PERMISSIONS.MANAGE_AVAILABILITY);
  const canManagePracticeSettings = hasPermission(
    PERMISSIONS.MANAGE_PRACTICE_SETTINGS
  );

  /**
   * Role checkers
   */
  const isAdmin = role === "admin";
  const isPractitioner = role === "practitioner";
  const isAssistant = role === "assistant";
  const isStaff = role === "staff";

  return {
    role,
    isLoading,
    hasPermission,
    // Permissions
    canManageClients,
    canManageAppointments,
    canViewSessions,
    canManageSessions,
    canViewMedicalData,
    canManageAvailability,
    canManagePracticeSettings,
    // Roles
    isAdmin,
    isPractitioner,
    isAssistant,
    isStaff,
  };
}
