import { PortalNav } from "@/components/portal/nav";

/**
 * Portal layout - shared layout for all portal pages
 * Provides navigation sidebar and main content area
 */
export default function PortalLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="flex h-screen overflow-hidden bg-gray-50 dark:bg-gray-900">
      <aside className="w-64 flex-shrink-0">
        <PortalNav />
      </aside>
      <main className="flex-1 overflow-y-auto">
        <div className="container mx-auto p-8">{children}</div>
      </main>
    </div>
  );
}
