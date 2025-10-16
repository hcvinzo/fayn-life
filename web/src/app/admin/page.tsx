/**
 * Admin Panel - Coming Soon
 * This will be implemented in Phase 2
 */
export default function AdminPage() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-900">
      <div className="text-center">
        <div className="text-6xl mb-4">🔧</div>
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">
          Admin Panel Coming Soon
        </h1>
        <p className="text-gray-600 dark:text-gray-400 mb-6">
          The admin panel will be available in Phase 2 of development.
        </p>
        <a
          href="/dashboard"
          className="inline-block px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
        >
          Back to Dashboard
        </a>
      </div>
    </div>
  );
}
