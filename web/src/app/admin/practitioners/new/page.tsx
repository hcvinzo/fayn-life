"use client";

import { useRouter } from "next/navigation";
import { PractitionerForm } from "@/components/admin/practitioner-form";
import { practitionerApi } from "@/lib/api/practitioner-api";
import type { CreatePractitionerInput } from "@/lib/validators/practitioner-schema";
import { ArrowLeft } from "lucide-react";
import Link from "next/link";

/**
 * New Practitioner Page
 * Create a new practitioner account
 */
export default function NewPractitionerPage() {
  const router = useRouter();

  const handleSubmit = async (data: CreatePractitionerInput) => {
    try {
      await practitionerApi.create(data);
      router.push("/admin/practitioners");
    } catch (error) {
      console.error("Error creating practitioner:", error);
      alert(error instanceof Error ? error.message : "Failed to create practitioner");
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center gap-4">
        <Link
          href="/admin/practitioners"
          className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
        >
          <ArrowLeft className="w-5 h-5 text-gray-600 dark:text-gray-400" />
        </Link>
        <div>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
            Add New Practitioner
          </h1>
          <p className="mt-2 text-gray-600 dark:text-gray-400">
            Create a new practitioner account
          </p>
        </div>
      </div>

      {/* Form */}
      <PractitionerForm onSubmit={handleSubmit} submitLabel="Create Practitioner" />
    </div>
  );
}
