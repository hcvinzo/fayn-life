"use client";

import { useRouter } from "next/navigation";
import { ClientForm } from "@/components/portal/client-form";
import { clientApi } from "@/lib/api/client-api";
import { ArrowLeft } from "lucide-react";
import Link from "next/link";

/**
 * New Client Page
 * Create a new client
 */
export default function NewClientPage() {
  const router = useRouter();

  const handleSubmit = async (data: Record<string, unknown>) => {
    try {
      await clientApi.create(data);
      router.push("/clients");
    } catch (error) {
      console.error("Error creating client:", error);
      alert(error instanceof Error ? error.message : "Failed to create client");
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center gap-4">
        <Link
          href="/clients"
          className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
        >
          <ArrowLeft className="w-5 h-5 text-gray-600 dark:text-gray-400" />
        </Link>
        <div>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
            Add New Client
          </h1>
          <p className="mt-2 text-gray-600 dark:text-gray-400">
            Create a new client record
          </p>
        </div>
      </div>

      {/* Form */}
      <ClientForm onSubmit={handleSubmit} submitLabel="Create Client" />
    </div>
  );
}
