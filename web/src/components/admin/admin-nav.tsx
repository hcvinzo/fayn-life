"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Users, Settings, LayoutDashboard, Building2, UserCog } from "lucide-react";

const navigation = [
  { name: "Dashboard", href: "/admin", icon: LayoutDashboard },
  { name: "Practices", href: "/admin/practices", icon: Building2 },
  { name: "Practitioners", href: "/admin/practitioners", icon: Users },
  { name: "Assistants", href: "/admin/assistants", icon: UserCog },
  { name: "Settings", href: "/admin/settings", icon: Settings },
];

export function AdminNav() {
  const pathname = usePathname();

  return (
    <nav className="flex flex-col gap-1">
      {navigation.map((item) => {
        // Special case for Dashboard (/admin) - must be exact match
        const isActive = item.href === "/admin"
          ? pathname === "/admin"
          : pathname === item.href || pathname?.startsWith(`${item.href}/`);
        const Icon = item.icon;

        return (
          <Link
            key={item.name}
            href={item.href}
            className={`flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-colors ${
              isActive
                ? "bg-blue-50 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400"
                : "text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700"
            }`}
          >
            <Icon className="h-5 w-5" />
            {item.name}
          </Link>
        );
      })}
    </nav>
  );
}
