"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { PracticeForm } from "@/components/admin/practice-form";
import { adminPracticeApi } from "@/lib/api/practice-api";
import type { Practice } from "@/types/practice";
import { ArrowLeft } from "lucide-react";
import Link from "next/link";

export default function EditPracticePage() {
  const params = useParams();
  const router = useRouter();
  const id = params.id as string;

  const [practice, setPractice] = useState<Practice | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchPractice = async () => {
      try {
        setLoading(true);
        setError(null);
        const data = await adminPracticeApi.getById(id);
        setPractice(data);
      } catch (err) {
        console.error("Error fetching practice:", err);
        setError(err instanceof Error ? err.message : "Failed to load practice");
      } finally {
        setLoading(false);
      }
    };

    if (id) {
      fetchPractice();
    }
  }, [id]);

  const handleSubmit = async (data: Record<string, unknown>) => {
    try {
      await adminPracticeApi.update(id, data);
      router.push(`/admin/practices/${id}`);
    } catch (error) {
      console.error("Error updating practice:", error);
      alert(error instanceof Error ? error.message : "Failed to update practice");
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <p className="text-gray-600 dark:text-gray-400">Loading practice...</p>
      </div>
    );
  }

  if (error || !practice) {
    return (
      <div className="space-y-6">
        <div className="flex items-center gap-4">
          <Link
            href="/admin/practices"
            className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
          >
            <ArrowLeft className="w-5 h-5 text-gray-600 dark:text-gray-400" />
          </Link>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
            Practice Not Found
          </h1>
        </div>
        <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-4">
          <p className="text-red-800 dark:text-red-400">{error || "Practice not found"}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Link
          href={`/admin/practices/${id}`}
          className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
        >
          <ArrowLeft className="w-5 h-5 text-gray-600 dark:text-gray-400" />
        </Link>
        <div>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
            Edit Practice
          </h1>
          <p className="mt-2 text-gray-600 dark:text-gray-400">
            Update {practice.name}'s information
          </p>
        </div>
      </div>
      <PracticeForm
        defaultValues={{
          name: practice.name,
          address: practice.address || undefined,
          phone: practice.phone || undefined,
          email: practice.email || undefined,
          status: practice.status,
        }}
        onSubmit={handleSubmit}
        submitLabel="Update Practice"
        isEditMode={true}
      />
    </div>
  );
}
