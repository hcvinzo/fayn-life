"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { AssistantForm } from "@/components/admin/assistant-form";
import { practitionerApi } from "@/lib/api/practitioner-api";
import { practitionerAssignmentApi } from "@/lib/api/practitioner-assignment-api";
import type { PractitionerWithPractice } from "@/types/practitioner";
import { ArrowLeft } from "lucide-react";
import Link from "next/link";

/**
 * Edit Assistant Page
 * Edit existing assistant information and practitioner assignments
 */
export default function EditAssistantPage() {
  const params = useParams();
  const router = useRouter();
  const id = params.id as string;

  const [assistant, setAssistant] = useState<PractitionerWithPractice | null>(
    null
  );
  const [currentAssignments, setCurrentAssignments] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        setError(null);

        // Fetch assistant profile
        const assistantData = await practitionerApi.getById(id);

        // Verify it's actually an assistant
        if (assistantData.role !== "assistant") {
          setError("This user is not an assistant");
          return;
        }

        setAssistant(assistantData);

        // Fetch current assignments
        const assignments =
          await practitionerAssignmentApi.getAssignmentsByAssistant(id);
        const practitionerIds = assignments.map((a) => a.practitioner_id);
        setCurrentAssignments(practitionerIds);
      } catch (err) {
        console.error("Error fetching assistant:", err);
        setError(
          err instanceof Error ? err.message : "Failed to load assistant"
        );
      } finally {
        setLoading(false);
      }
    };

    if (id) {
      fetchData();
    }
  }, [id]);

  const handleSubmit = async (
    data: Record<string, unknown>,
    assignedPractitionerIds: string[]
  ) => {
    try {
      // Step 1: Update assistant profile
      await practitionerApi.update(id, data);

      // Step 2: Replace practitioner assignments
      if (assistant?.practice_id) {
        await practitionerAssignmentApi.replaceAssignments({
          assistantId: id,
          practitionerIds: assignedPractitionerIds,
          practiceId: assistant.practice_id,
        });
      }

      // Redirect to assistant details
      router.push(`/admin/assistants/${id}`);
    } catch (error) {
      console.error("Error updating assistant:", error);
      alert(
        error instanceof Error ? error.message : "Failed to update assistant"
      );
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <p className="text-gray-600 dark:text-gray-400">
          Loading assistant...
        </p>
      </div>
    );
  }

  if (error || !assistant) {
    return (
      <div className="space-y-6">
        <div className="flex items-center gap-4">
          <Link
            href="/admin/assistants"
            className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
          >
            <ArrowLeft className="w-5 h-5 text-gray-600 dark:text-gray-400" />
          </Link>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
            Assistant Not Found
          </h1>
        </div>
        <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-4">
          <p className="text-red-800 dark:text-red-400">
            {error || "Assistant not found"}
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center gap-4">
        <Link
          href={`/admin/assistants/${id}`}
          className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
        >
          <ArrowLeft className="w-5 h-5 text-gray-600 dark:text-gray-400" />
        </Link>
        <div>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
            Edit Assistant
          </h1>
          <p className="mt-2 text-gray-600 dark:text-gray-400">
            Update {assistant.full_name || assistant.email}&apos;s information
            and practitioner assignments
          </p>
        </div>
      </div>

      {/* Form */}
      <AssistantForm
        defaultValues={{
          full_name: assistant.full_name || "",
          email: assistant.email,
          role: assistant.role,
          status: assistant.status,
          practice_id: assistant.practice_id || undefined,
        }}
        currentAssignments={currentAssignments}
        onSubmit={handleSubmit}
        submitLabel="Update Assistant"
        isEditMode={true}
      />
    </div>
  );
}
