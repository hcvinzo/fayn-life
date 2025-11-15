"use client";

import Link from "next/link";
import Image from "next/image";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";
import { useAuth } from "@/hooks/use-auth";
import { usePermissions } from "@/hooks/use-permissions";
import {
  LayoutDashboard,
  Users,
  Calendar,
  CalendarDays,
  Settings,
  LogOut,
} from "lucide-react";
import type { PermissionCode } from "@/types/permission";

interface NavItem {
  name: string;
  href: string;
  icon: typeof LayoutDashboard;
  permission?: PermissionCode; // If specified, user must have this permission
}

const navItems: NavItem[] = [
  {
    name: "Dashboard",
    href: "/dashboard",
    icon: LayoutDashboard,
    // No permission required - everyone can see dashboard
  },
  {
    name: "Clients",
    href: "/clients",
    icon: Users,
    permission: "manage_clients",
  },
  {
    name: "Appointments",
    href: "/appointments",
    icon: Calendar,
    permission: "manage_appointments",
  },
  {
    name: "Calendar",
    href: "/calendar",
    icon: CalendarDays,
    permission: "manage_appointments",
  },
  {
    name: "Settings",
    href: "/settings",
    icon: Settings,
    // No specific permission - settings page will handle its own permission checks
  },
];

/**
 * Portal navigation component
 * Displays sidebar navigation for the portal
 * Items are filtered based on user permissions
 */
export function PortalNav() {
  const pathname = usePathname();
  const { signOut, profile } = useAuth();
  const { hasPermission, isLoading: isPermissionsLoading } = usePermissions();

  // Filter nav items based on permissions
  const visibleNavItems = navItems.filter((item) => {
    // If no permission specified, show to everyone
    if (!item.permission) return true;

    // While loading permissions, show all items to avoid flash
    if (isPermissionsLoading) return true;

    // Check if user has the required permission
    return hasPermission(item.permission);
  });

  return (
    <div className="flex flex-col h-full bg-white dark:bg-gray-800 border-r border-gray-200 dark:border-gray-700">
      <div className="p-6">
        <Image
          src="/logo.png"
          alt="fayn.life"
          width={150}
          height={50}
          priority
          className="mb-4"
        />
        {profile && (
          <p className="mt-1 text-sm text-gray-600 dark:text-gray-400">
            {profile.full_name || profile.email}
          </p>
        )}
      </div>

      <nav className="flex-1 px-4 space-y-1">
        {visibleNavItems.map((item) => {
          const Icon = item.icon;
          const isActive = pathname === item.href;

          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                "flex items-center gap-3 px-4 py-3 rounded-lg text-sm font-medium transition-colors",
                isActive
                  ? "bg-blue-50 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400"
                  : "text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700"
              )}
            >
              <Icon className="w-5 h-5" />
              {item.name}
            </Link>
          );
        })}
      </nav>

      <div className="p-4 border-t border-gray-200 dark:border-gray-700">
        <button
          onClick={() => signOut()}
          className="flex items-center gap-3 w-full px-4 py-3 rounded-lg text-sm font-medium text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
        >
          <LogOut className="w-5 h-5" />
          Sign Out
        </button>
      </div>
    </div>
  );
}
