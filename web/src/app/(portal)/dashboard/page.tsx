import { Metadata } from "next";

export const metadata: Metadata = {
  title: "Dashboard",
};

/**
 * Dashboard page
 * Displays overview statistics and recent activity
 */
export default function DashboardPage() {
  // Mock data for demonstration
  const stats = [
    {
      label: "Total Clients",
      value: "124",
      change: "+12%",
      trend: "up" as const,
    },
    {
      label: "Active Clients",
      value: "98",
      change: "+5%",
      trend: "up" as const,
    },
    {
      label: "Today's Appointments",
      value: "8",
      change: "2 pending",
      trend: "neutral" as const,
    },
    {
      label: "This Week",
      value: "42",
      change: "+8%",
      trend: "up" as const,
    },
  ];

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
          Dashboard
        </h1>
        <p className="mt-2 text-gray-600 dark:text-gray-400">
          Welcome back! Here&apos;s what&apos;s happening today.
        </p>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {stats.map((stat) => (
          <div
            key={stat.label}
            className="bg-white dark:bg-gray-800 rounded-lg shadow p-6 border border-gray-200 dark:border-gray-700"
          >
            <div className="text-sm font-medium text-gray-600 dark:text-gray-400">
              {stat.label}
            </div>
            <div className="mt-2 flex items-baseline gap-2">
              <div className="text-3xl font-bold text-gray-900 dark:text-white">
                {stat.value}
              </div>
              <div
                className={
                  stat.trend === "up"
                    ? "text-sm text-green-600 dark:text-green-400"
                    : "text-sm text-gray-600 dark:text-gray-400"
                }
              >
                {stat.change}
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Recent Activity */}
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow border border-gray-200 dark:border-gray-700">
        <div className="px-6 py-4 border-b border-gray-200 dark:border-gray-700">
          <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
            Recent Activity
          </h2>
        </div>
        <div className="p-6">
          <p className="text-gray-600 dark:text-gray-400">
            No recent activity to display. Your appointments and client
            interactions will appear here.
          </p>
        </div>
      </div>

      {/* Quick Actions */}
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow border border-gray-200 dark:border-gray-700">
        <div className="px-6 py-4 border-b border-gray-200 dark:border-gray-700">
          <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
            Quick Actions
          </h2>
        </div>
        <div className="p-6 grid grid-cols-1 md:grid-cols-3 gap-4">
          <button className="p-4 border-2 border-dashed border-gray-300 dark:border-gray-600 rounded-lg hover:border-blue-500 dark:hover:border-blue-400 transition-colors text-gray-600 dark:text-gray-400 hover:text-blue-600 dark:hover:text-blue-400">
            + New Client
          </button>
          <button className="p-4 border-2 border-dashed border-gray-300 dark:border-gray-600 rounded-lg hover:border-blue-500 dark:hover:border-blue-400 transition-colors text-gray-600 dark:text-gray-400 hover:text-blue-600 dark:hover:text-blue-400">
            + New Appointment
          </button>
          <button className="p-4 border-2 border-dashed border-gray-300 dark:border-gray-600 rounded-lg hover:border-blue-500 dark:hover:border-blue-400 transition-colors text-gray-600 dark:text-gray-400 hover:text-blue-600 dark:hover:text-blue-400">
            View Calendar
          </button>
        </div>
      </div>
    </div>
  );
}
