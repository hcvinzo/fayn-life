"use client";

import { ReactNode } from "react";
import { usePermissions } from "@/hooks/use-permissions";
import { PermissionCode, UserRole } from "@/types/permission";

interface PermissionGateProps {
  children: ReactNode;
  /**
   * Required permission code
   */
  permission?: PermissionCode;
  /**
   * Required role (alternative to permission)
   */
  role?: UserRole | UserRole[];
  /**
   * Content to show when permission is denied
   */
  fallback?: ReactNode;
  /**
   * If true, renders nothing when permission is denied (instead of fallback)
   */
  hideOnDeny?: boolean;
}

/**
 * Permission Gate Component
 * Conditionally renders children based on user permissions or role
 *
 * Usage with permission:
 * ```tsx
 * <PermissionGate permission="manage_clients">
 *   <Button>Add Client</Button>
 * </PermissionGate>
 * ```
 *
 * Usage with role:
 * ```tsx
 * <PermissionGate role="admin">
 *   <AdminPanel />
 * </PermissionGate>
 * ```
 *
 * Usage with multiple roles:
 * ```tsx
 * <PermissionGate role={["admin", "practitioner"]}>
 *   <PracticeSettings />
 * </PermissionGate>
 * ```
 *
 * Usage with fallback:
 * ```tsx
 * <PermissionGate
 *   permission="view_sessions"
 *   fallback={<p>You don't have access to view sessions</p>}
 * >
 *   <SessionList />
 * </PermissionGate>
 * ```
 */
export function PermissionGate({
  children,
  permission,
  role,
  fallback = null,
  hideOnDeny = false,
}: PermissionGateProps) {
  const { hasPermission, role: userRole, isLoading } = usePermissions();

  // While loading, don't render anything to avoid flash
  if (isLoading) {
    return null;
  }

  // Check permission if specified
  if (permission) {
    const hasRequiredPermission = hasPermission(permission);
    if (!hasRequiredPermission) {
      return hideOnDeny ? null : <>{fallback}</>;
    }
    return <>{children}</>;
  }

  // Check role if specified
  if (role) {
    const roles = Array.isArray(role) ? role : [role];
    const hasRequiredRole = userRole && roles.includes(userRole);
    if (!hasRequiredRole) {
      return hideOnDeny ? null : <>{fallback}</>;
    }
    return <>{children}</>;
  }

  // If neither permission nor role specified, render children
  return <>{children}</>;
}
