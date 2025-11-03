"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { PractitionerForm } from "@/components/admin/practitioner-form";
import { practitionerApi } from "@/lib/api/practitioner-api";
import type { PractitionerWithPractice } from "@/types/practitioner";
import { ArrowLeft } from "lucide-react";
import Link from "next/link";

/**
 * Edit Practitioner Page
 * Edit existing practitioner information
 */
export default function EditPractitionerPage() {
  const params = useParams();
  const router = useRouter();
  const id = params.id as string;

  const [practitioner, setPractitioner] = useState<PractitionerWithPractice | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchPractitioner = async () => {
      try {
        setLoading(true);
        setError(null);
        const data = await practitionerApi.getById(id);
        setPractitioner(data);
      } catch (err) {
        console.error("Error fetching practitioner:", err);
        setError(err instanceof Error ? err.message : "Failed to load practitioner");
      } finally {
        setLoading(false);
      }
    };

    if (id) {
      fetchPractitioner();
    }
  }, [id]);

  const handleSubmit = async (data: Record<string, unknown>) => {
    try {
      await practitionerApi.update(id, data);
      router.push(`/admin/practitioners/${id}`);
    } catch (error) {
      console.error("Error updating practitioner:", error);
      alert(error instanceof Error ? error.message : "Failed to update practitioner");
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <p className="text-gray-600 dark:text-gray-400">Loading practitioner...</p>
      </div>
    );
  }

  if (error || !practitioner) {
    return (
      <div className="space-y-6">
        <div className="flex items-center gap-4">
          <Link
            href="/admin/practitioners"
            className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
          >
            <ArrowLeft className="w-5 h-5 text-gray-600 dark:text-gray-400" />
          </Link>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
            Practitioner Not Found
          </h1>
        </div>
        <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-4">
          <p className="text-red-800 dark:text-red-400">{error || "Practitioner not found"}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center gap-4">
        <Link
          href={`/admin/practitioners/${id}`}
          className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
        >
          <ArrowLeft className="w-5 h-5 text-gray-600 dark:text-gray-400" />
        </Link>
        <div>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
            Edit Practitioner
          </h1>
          <p className="mt-2 text-gray-600 dark:text-gray-400">
            Update {practitioner.full_name || practitioner.email}&apos;s information
          </p>
        </div>
      </div>

      {/* Form */}
      <PractitionerForm
        defaultValues={{
          full_name: practitioner.full_name || "",
          email: practitioner.email,
          role: practitioner.role,
          status: practitioner.status,
          practice_id: practitioner.practice_id || undefined,
        }}
        onSubmit={handleSubmit}
        submitLabel="Update Practitioner"
        isEditMode={true}
      />
    </div>
  );
}
