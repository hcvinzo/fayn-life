"use client";

import { useRouter } from "next/navigation";
import { PracticeForm } from "@/components/admin/practice-form";
import { adminPracticeApi } from "@/lib/api/practice-api";
import type { CreatePracticeInput } from "@/lib/validators/practice";
import { ArrowLeft } from "lucide-react";
import Link from "next/link";

export default function NewPracticePage() {
  const router = useRouter();

  const handleSubmit = async (data: CreatePracticeInput) => {
    try {
      await adminPracticeApi.create(data);
      router.push("/admin/practices");
    } catch (error) {
      console.error("Error creating practice:", error);
      alert(error instanceof Error ? error.message : "Failed to create practice");
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Link
          href="/admin/practices"
          className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
        >
          <ArrowLeft className="w-5 h-5 text-gray-600 dark:text-gray-400" />
        </Link>
        <div>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
            Add New Practice
          </h1>
          <p className="mt-2 text-gray-600 dark:text-gray-400">
            Create a new practice organization
          </p>
        </div>
      </div>
      <PracticeForm onSubmit={handleSubmit} submitLabel="Create Practice" />
    </div>
  );
}
