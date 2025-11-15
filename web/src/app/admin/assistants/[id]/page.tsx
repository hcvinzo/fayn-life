"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { practitionerApi } from "@/lib/api/practitioner-api";
import { practitionerAssignmentApi } from "@/lib/api/practitioner-assignment-api";
import type { PractitionerWithPractice } from "@/types/practitioner";
import type { AssignedPractitioner } from "@/types/permission";
import { ArrowLeft, Edit, Users, Mail, Building, Calendar } from "lucide-react";
import Link from "next/link";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";

/**
 * View Assistant Page
 * Display assistant details and assigned practitioners
 */
export default function ViewAssistantPage() {
  const params = useParams();
  const router = useRouter();
  const id = params.id as string;

  const [assistant, setAssistant] = useState<PractitionerWithPractice | null>(
    null
  );
  const [assignedPractitioners, setAssignedPractitioners] = useState<
    AssignedPractitioner[]
  >([]);
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

        // Fetch assigned practitioners
        const assignments =
          await practitionerAssignmentApi.getAssignmentsByAssistant(id);

        // Get practitioner profiles (we need full details)
        const practitionerIds = assignments.map((a) => a.practitioner_id);
        const practitionerProfiles = await Promise.all(
          practitionerIds.map((practId) => practitionerApi.getById(practId))
        );

        const mappedPractitioners: AssignedPractitioner[] =
          practitionerProfiles.map((p) => ({
            id: p.id,
            full_name: p.full_name || "",
            email: p.email,
          }));

        setAssignedPractitioners(mappedPractitioners);
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

  // Format date helper
  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("en-US", {
      year: "numeric",
      month: "long",
      day: "numeric",
    });
  };

  // Status badge color helper
  const getStatusColor = (status: string) => {
    switch (status) {
      case "active":
        return "bg-green-100 dark:bg-green-900/20 text-green-800 dark:text-green-400";
      case "suspended":
        return "bg-yellow-100 dark:bg-yellow-900/20 text-yellow-800 dark:text-yellow-400";
      case "blocked":
        return "bg-red-100 dark:bg-red-900/20 text-red-800 dark:text-red-400";
      case "pending":
        return "bg-gray-100 dark:bg-gray-900/20 text-gray-800 dark:text-gray-400";
      default:
        return "bg-gray-100 dark:bg-gray-900/20 text-gray-800 dark:text-gray-400";
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
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Link
            href="/admin/assistants"
            className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
          >
            <ArrowLeft className="w-5 h-5 text-gray-600 dark:text-gray-400" />
          </Link>
          <div>
            <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
              {assistant.full_name || "Unnamed Assistant"}
            </h1>
            <p className="mt-1 text-gray-600 dark:text-gray-400">
              Assistant Account Details
            </p>
          </div>
        </div>
        <Button
          onClick={() => router.push(`/admin/assistants/${id}/edit`)}
          variant="default"
        >
          <Edit className="w-4 h-4 mr-2" />
          Edit Assistant
        </Button>
      </div>

      {/* Assistant Information */}
      <Card>
        <CardHeader>
          <CardTitle>Account Information</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Email */}
            <div className="flex items-start gap-3">
              <div className="p-2 bg-blue-100 dark:bg-blue-900/20 rounded-lg">
                <Mail className="w-5 h-5 text-blue-600 dark:text-blue-400" />
              </div>
              <div>
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  Email
                </p>
                <p className="font-medium text-gray-900 dark:text-white">
                  {assistant.email}
                </p>
              </div>
            </div>

            {/* Practice */}
            <div className="flex items-start gap-3">
              <div className="p-2 bg-purple-100 dark:bg-purple-900/20 rounded-lg">
                <Building className="w-5 h-5 text-purple-600 dark:text-purple-400" />
              </div>
              <div>
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  Practice
                </p>
                <p className="font-medium text-gray-900 dark:text-white">
                  {assistant.practice?.name || "No practice assigned"}
                </p>
              </div>
            </div>

            {/* Status */}
            <div className="flex items-start gap-3">
              <div className="p-2 bg-green-100 dark:bg-green-900/20 rounded-lg">
                <Users className="w-5 h-5 text-green-600 dark:text-green-400" />
              </div>
              <div>
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  Status
                </p>
                <span
                  className={`inline-block px-2 py-1 text-xs font-medium rounded-full ${getStatusColor(
                    assistant.status
                  )}`}
                >
                  {assistant.status.charAt(0).toUpperCase() +
                    assistant.status.slice(1)}
                </span>
              </div>
            </div>

            {/* Created Date */}
            <div className="flex items-start gap-3">
              <div className="p-2 bg-gray-100 dark:bg-gray-900/20 rounded-lg">
                <Calendar className="w-5 h-5 text-gray-600 dark:text-gray-400" />
              </div>
              <div>
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  Created
                </p>
                <p className="font-medium text-gray-900 dark:text-white">
                  {formatDate(assistant.created_at)}
                </p>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Assigned Practitioners */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Users className="w-5 h-5" />
            Assigned Practitioners ({assignedPractitioners.length})
          </CardTitle>
          <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
            Practitioners this assistant can manage appointments for
          </p>
        </CardHeader>
        <CardContent>
          {assignedPractitioners.length === 0 ? (
            <div className="text-center py-8">
              <p className="text-gray-600 dark:text-gray-400">
                No practitioners assigned yet
              </p>
              <p className="text-sm text-gray-500 dark:text-gray-500 mt-1">
                Click "Edit Assistant" to assign practitioners
              </p>
            </div>
          ) : (
            <div className="space-y-3">
              {assignedPractitioners.map((practitioner) => (
                <div
                  key={practitioner.id}
                  className="flex items-center gap-3 p-3 border border-gray-200 dark:border-gray-700 rounded-lg"
                >
                  <div className="p-2 bg-blue-100 dark:bg-blue-900/20 rounded-lg">
                    <Users className="w-4 h-4 text-blue-600 dark:text-blue-400" />
                  </div>
                  <div className="flex-1">
                    <p className="font-medium text-gray-900 dark:text-white">
                      {practitioner.full_name || "Unnamed"}
                    </p>
                    <p className="text-sm text-gray-600 dark:text-gray-400">
                      {practitioner.email}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
