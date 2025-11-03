import { Users, Settings, Building2 } from "lucide-react";
import Link from "next/link";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

export default function AdminDashboardPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
          Admin Dashboard
        </h1>
        <p className="mt-2 text-sm text-gray-600 dark:text-gray-400">
          Manage practices, practitioners, settings, and system configuration
        </p>
      </div>

      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        {/* Practices Management Card */}
        <Link href="/admin/practices">
          <Card className="transition-all hover:shadow-lg hover:scale-105 cursor-pointer">
            <CardHeader>
              <div className="flex items-center gap-2">
                <Building2 className="h-6 w-6 text-green-600 dark:text-green-400" />
                <CardTitle>Practices</CardTitle>
              </div>
              <CardDescription>
                Manage practice organizations and locations
              </CardDescription>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-gray-600 dark:text-gray-400">
                View, create, edit, and manage practice information and status
              </p>
            </CardContent>
          </Card>
        </Link>

        {/* Practitioners Management Card */}
        <Link href="/admin/practitioners">
          <Card className="transition-all hover:shadow-lg hover:scale-105 cursor-pointer">
            <CardHeader>
              <div className="flex items-center gap-2">
                <Users className="h-6 w-6 text-blue-600 dark:text-blue-400" />
                <CardTitle>Practitioners</CardTitle>
              </div>
              <CardDescription>
                Manage practitioner accounts and permissions
              </CardDescription>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-gray-600 dark:text-gray-400">
                View, create, edit, and manage practitioner status
              </p>
            </CardContent>
          </Card>
        </Link>

        {/* Settings Card */}
        <Link href="/admin/settings">
          <Card className="transition-all hover:shadow-lg hover:scale-105 cursor-pointer">
            <CardHeader>
              <div className="flex items-center gap-2">
                <Settings className="h-6 w-6 text-gray-600 dark:text-gray-400" />
                <CardTitle>Settings</CardTitle>
              </div>
              <CardDescription>
                Configure system settings and preferences
              </CardDescription>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-gray-600 dark:text-gray-400">
                Manage system-wide configuration options
              </p>
            </CardContent>
          </Card>
        </Link>
      </div>
    </div>
  );
}
