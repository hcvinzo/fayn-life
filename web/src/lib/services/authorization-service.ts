/**
 * Authorization Service
 * Handles permission checks and role-based authorization
 */

import { createClient } from "@/lib/supabase/server";
import {
  UserRole,
  PermissionCode,
  roleHasPermission,
  PERMISSIONS,
} from "@/types/permission";
import { practitionerAssignmentRepository } from "@/lib/repositories/practitioner-assignment-repository";

export interface AuthorizationContext {
  userId: string;
  role: UserRole;
  practiceId: string;
  assignedPractitionerIds?: string[]; // For assistants only
}

export class AuthorizationService {
  /**
   * Get authorization context for current user
   */
  async getAuthorizationContext(
    userId: string
  ): Promise<AuthorizationContext | null> {
    const supabase = await createClient();

    const { data: profile, error } = await supabase
      .from("profiles")
      .select("role, practice_id")
      .eq("id", userId)
      .single();

    if (error || !profile) {
      return null;
    }

    // Admin users don't need a practice_id (they're system-wide)
    // Other roles require a practice_id
    if (profile.role !== "admin" && !profile.practice_id) {
      return null;
    }

    const context: AuthorizationContext = {
      userId,
      role: profile.role,
      practiceId: profile.practice_id || "", // Empty string for admins
    };

    // For assistants, load assigned practitioner IDs
    if (profile.role === "assistant") {
      const practitionerIds =
        await practitionerAssignmentRepository.getAssignedPractitionerIds(
          userId
        );
      context.assignedPractitionerIds = practitionerIds;
    }

    return context;
  }

  /**
   * Check if user has a specific permission
   */
  hasPermission(context: AuthorizationContext, permission: PermissionCode): boolean {
    return roleHasPermission(context.role, permission);
  }

  /**
   * Check if user can manage clients
   */
  canManageClients(context: AuthorizationContext): boolean {
    return this.hasPermission(context, PERMISSIONS.MANAGE_CLIENTS);
  }

  /**
   * Check if user can manage appointments
   */
  canManageAppointments(context: AuthorizationContext): boolean {
    return this.hasPermission(context, PERMISSIONS.MANAGE_APPOINTMENTS);
  }

  /**
   * Check if user can view sessions
   */
  canViewSessions(context: AuthorizationContext): boolean {
    return this.hasPermission(context, PERMISSIONS.VIEW_SESSIONS);
  }

  /**
   * Check if user can manage sessions
   */
  canManageSessions(context: AuthorizationContext): boolean {
    return this.hasPermission(context, PERMISSIONS.MANAGE_SESSIONS);
  }

  /**
   * Check if user can view medical data
   */
  canViewMedicalData(context: AuthorizationContext): boolean {
    return this.hasPermission(context, PERMISSIONS.VIEW_MEDICAL_DATA);
  }

  /**
   * Check if user can manage availability
   */
  canManageAvailability(context: AuthorizationContext): boolean {
    return this.hasPermission(context, PERMISSIONS.MANAGE_AVAILABILITY);
  }

  /**
   * Check if user can manage practice settings
   */
  canManagePracticeSettings(context: AuthorizationContext): boolean {
    return this.hasPermission(context, PERMISSIONS.MANAGE_PRACTICE_SETTINGS);
  }

  /**
   * Check if assistant can access a specific practitioner's data
   * For non-assistants, always returns true (they can access all in practice)
   */
  canAccessPractitioner(
    context: AuthorizationContext,
    practitionerId: string
  ): boolean {
    // Admins and practitioners can access all data in their practice
    if (context.role === "admin" || context.role === "practitioner") {
      return true;
    }

    // Assistants can only access assigned practitioners
    if (context.role === "assistant") {
      return (
        context.assignedPractitionerIds?.includes(practitionerId) || false
      );
    }

    // Staff - same as practitioners (can access all)
    return true;
  }

  /**
   * Check if user can create/edit an appointment for a specific practitioner
   */
  async canManageAppointmentForPractitioner(
    context: AuthorizationContext,
    practitionerId: string
  ): Promise<boolean> {
    // First check if user has appointment management permission
    if (!this.canManageAppointments(context)) {
      return false;
    }

    // Then check if they can access this specific practitioner
    return this.canAccessPractitioner(context, practitionerId);
  }

  /**
   * Get list of practitioner IDs the user can access
   * For assistants: only assigned practitioners
   * For others: all practitioners in the practice
   */
  async getAccessiblePractitionerIds(
    context: AuthorizationContext
  ): Promise<string[]> {
    // Assistants only see assigned practitioners
    if (context.role === "assistant") {
      return context.assignedPractitionerIds || [];
    }

    // Admins, practitioners, and staff see all practitioners in practice
    const supabase = await createClient();
    const { data, error } = await supabase
      .from("profiles")
      .select("id")
      .eq("practice_id", context.practiceId)
      .eq("role", "practitioner");

    if (error) throw error;
    return data?.map((p) => p.id) || [];
  }

  /**
   * Validate that user belongs to the specified practice
   */
  isInPractice(context: AuthorizationContext, practiceId: string): boolean {
    return context.practiceId === practiceId;
  }

  /**
   * Check if user is admin
   */
  isAdmin(context: AuthorizationContext): boolean {
    return context.role === "admin";
  }

  /**
   * Check if user is practitioner
   */
  isPractitioner(context: AuthorizationContext): boolean {
    return context.role === "practitioner";
  }

  /**
   * Check if user is assistant
   */
  isAssistant(context: AuthorizationContext): boolean {
    return context.role === "assistant";
  }

  /**
   * Check if user is staff
   */
  isStaff(context: AuthorizationContext): boolean {
    return context.role === "staff";
  }
}

// Export singleton instance
export const authorizationService = new AuthorizationService();

// Export server-specific instance (for consistency with other services)
export const serverAuthorizationService = authorizationService;
