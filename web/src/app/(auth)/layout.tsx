import Image from "next/image";

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
          <div className="flex justify-center mb-4">
            <Image
              src="/logo.png"
              alt="fayn.life"
              width={200}
              height={67}
              priority
            />
          </div>
          <p className="mt-2 text-gray-600 dark:text-gray-400">
            Practice Management Platform
          </p>
        </div>
        {children}
      </div>
    </div>
  );
}
