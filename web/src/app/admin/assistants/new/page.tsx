"use client";

import { useRouter } from "next/navigation";
import { AssistantForm } from "@/components/admin/assistant-form";
import { practitionerApi } from "@/lib/api/practitioner-api";
import { practitionerAssignmentApi } from "@/lib/api/practitioner-assignment-api";
import type { CreatePractitionerInput, UpdatePractitionerInput } from "@/lib/validators/practitioner-schema";
import { ArrowLeft } from "lucide-react";
import Link from "next/link";

/**
 * New Assistant Page
 * Create a new assistant account with practitioner assignments
 */
export default function NewAssistantPage() {
  const router = useRouter();

  const handleSubmit = async (
    data: CreatePractitionerInput | UpdatePractitionerInput,
    assignedPractitionerIds: string[]
  ) => {
    // Type guard: in create mode, data must have email
    if (!('email' in data) || !data.email) {
      throw new Error('Email is required for creating a new assistant');
    }
    const createData = data as CreatePractitionerInput;
    try {
      // Step 1: Create the assistant account
      const assistant = await practitionerApi.create({
        ...createData,
        role: "assistant", // Force role to assistant
      });

      // Step 2: Create practitioner assignments if any selected
      if (assignedPractitionerIds.length > 0 && createData.practice_id) {
        await practitionerAssignmentApi.createBulkAssignments({
          assistantId: assistant.id,
          practitionerIds: assignedPractitionerIds,
          practiceId: createData.practice_id,
        });
      }

      // Redirect to assistants list
      router.push("/admin/assistants");
    } catch (error) {
      console.error("Error creating assistant:", error);
      alert(
        error instanceof Error ? error.message : "Failed to create assistant"
      );
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center gap-4">
        <Link
          href="/admin/assistants"
          className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
        >
          <ArrowLeft className="w-5 h-5 text-gray-600 dark:text-gray-400" />
        </Link>
        <div>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
            Add New Assistant
          </h1>
          <p className="mt-2 text-gray-600 dark:text-gray-400">
            Create a new assistant account and assign practitioners
          </p>
        </div>
      </div>

      {/* Form */}
      <AssistantForm onSubmit={handleSubmit} submitLabel="Create Assistant" />
    </div>
  );
}
