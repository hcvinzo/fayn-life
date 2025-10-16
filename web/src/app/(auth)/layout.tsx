import { APP_NAME } from "@/lib/constants";

/**
 * Auth layout - shared layout for login and register pages
 * Centers content and provides consistent styling
 */
export default function AuthLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-indigo-100 dark:from-gray-900 dark:to-gray-800">
      <div className="w-full max-w-md px-4">
        <div className="mb-8 text-center">
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
            {APP_NAME}
          </h1>
          <p className="mt-2 text-gray-600 dark:text-gray-400">
            Practice Management Platform
          </p>
        </div>
        {children}
      </div>
    </div>
  );
}
