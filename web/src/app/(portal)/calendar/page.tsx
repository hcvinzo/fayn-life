import { Metadata } from "next";
import { ChevronLeft, ChevronRight } from "lucide-react";

export const metadata: Metadata = {
  title: "Calendar",
};

/**
 * Calendar page
 * Displays calendar view of appointments
 */
export default function CalendarPage() {
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
            Calendar
          </h1>
          <p className="mt-2 text-gray-600 dark:text-gray-400">
            View your appointments in calendar format
          </p>
        </div>
        <div className="flex items-center gap-2">
          <button className="px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors">
            <ChevronLeft className="w-5 h-5 text-gray-600 dark:text-gray-400" />
          </button>
          <div className="px-4 py-2 font-medium text-gray-900 dark:text-white">
            January 2024
          </div>
          <button className="px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors">
            <ChevronRight className="w-5 h-5 text-gray-600 dark:text-gray-400" />
          </button>
        </div>
      </div>

      {/* Calendar Placeholder */}
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow border border-gray-200 dark:border-gray-700 p-6">
        <div className="text-center py-12">
          <div className="text-6xl mb-4">📅</div>
          <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">
            Calendar View Coming Soon
          </h3>
          <p className="text-gray-600 dark:text-gray-400">
            Full calendar integration with appointment scheduling will be
            available in the next update.
          </p>
          <div className="mt-6">
            <a
              href="/appointments"
              className="text-blue-600 dark:text-blue-400 hover:underline"
            >
              View appointments list instead
            </a>
          </div>
        </div>
      </div>
    </div>
  );
}
