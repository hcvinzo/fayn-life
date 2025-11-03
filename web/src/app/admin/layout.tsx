import { AdminNav } from "@/components/admin/admin-nav";
import { ArrowLeft } from "lucide-react";
import Link from "next/link";

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      <div className="flex">
        {/* Sidebar */}
        <aside className="fixed inset-y-0 left-0 z-10 w-64 border-r border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800">
          <div className="flex h-full flex-col">
            {/* Header */}
            <div className="border-b border-gray-200 dark:border-gray-700 p-6">
              <h2 className="text-xl font-bold text-gray-900 dark:text-white">
                Admin Panel
              </h2>
              <p className="mt-1 text-sm text-gray-600 dark:text-gray-400">
                System Administration
              </p>
            </div>

            {/* Navigation */}
            <div className="flex-1 overflow-y-auto p-4">
              <AdminNav />
            </div>

            {/* Back to Portal */}
            <div className="border-t border-gray-200 dark:border-gray-700 p-4">
              <Link
                href="/dashboard"
                className="flex items-center gap-2 rounded-lg px-3 py-2 text-sm font-medium text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
              >
                <ArrowLeft className="h-4 w-4" />
                Back to Portal
              </Link>
            </div>
          </div>
        </aside>

        {/* Main Content */}
        <main className="flex-1 ml-64">
          <div className="p-8">{children}</div>
        </main>
      </div>
    </div>
  );
}
