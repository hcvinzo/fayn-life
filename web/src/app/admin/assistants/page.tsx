"use client";

import { Search, Plus, Edit, Eye, UserX, Loader2, Users } from "lucide-react";
import { useEffect, useState, useCallback } from "react";
import { practitionerApi } from "@/lib/api/practitioner-api";
import type { PractitionerWithPractice } from "@/types/practitioner";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { ColumnDef } from "@tanstack/react-table";
import { DataTable } from "@/components/ui/data-table";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";

/**
 * Assistants Admin Page
 * Displays list of all assistants with search capabilities
 */
export default function AssistantsAdminPage() {
  const router = useRouter();
  const [assistants, setAssistants] = useState<PractitionerWithPractice[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [isNavigating, setIsNavigating] = useState(false);

  // Format date helper
  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
    });
  };

  // Delete assistant handler
  const handleDelete = async (id: string, assistantName: string) => {
    if (
      !confirm(
        `Are you sure you want to delete ${assistantName}? This will remove all practitioner assignments. This action cannot be undone.`
      )
    ) {
      return;
    }

    try {
      await practitionerApi.delete(id);
      fetchAssistants(); // Refresh list
    } catch (err) {
      console.error("Error deleting assistant:", err);
      alert("Failed to delete assistant");
    }
  };

  // Column definitions for DataTable
  const columns: ColumnDef<PractitionerWithPractice>[] = [
    {
      accessorKey: "full_name",
      header: "Name",
      cell: ({ row }) => (
        <div className="text-sm font-medium text-gray-900 dark:text-white">
          {row.getValue("full_name") || "-"}
        </div>
      ),
    },
    {
      accessorKey: "email",
      header: "Email",
      cell: ({ row }) => (
        <div className="text-sm text-gray-600 dark:text-gray-400">
          {row.getValue("email")}
        </div>
      ),
    },
    {
      accessorKey: "practice",
      header: "Practice",
      cell: ({ row }) => {
        const practice = row.original.practice;
        return (
          <div className="text-sm text-gray-600 dark:text-gray-400">
            {practice?.name || "-"}
          </div>
        );
      },
    },
    {
      id: "assignments",
      header: "Assigned Practitioners",
      cell: ({ row }) => {
        // TODO: Display count of assigned practitioners
        // Will need to add this data to the API response
        return (
          <div className="flex items-center gap-1 text-sm text-gray-600 dark:text-gray-400">
            <Users className="w-4 h-4" />
            <span>View assignments</span>
          </div>
        );
      },
    },
    {
      accessorKey: "status",
      header: "Status",
      cell: ({ row }) => {
        const status = row.getValue("status") as string;
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
        return (
          <span
            className={`px-2 py-1 text-xs font-medium rounded-full ${getStatusColor(
              status
            )}`}
          >
            {status.charAt(0).toUpperCase() + status.slice(1)}
          </span>
        );
      },
    },
    {
      accessorKey: "created_at",
      header: "Created",
      cell: ({ row }) => (
        <div className="text-sm text-gray-600 dark:text-gray-400">
          {formatDate(row.getValue("created_at"))}
        </div>
      ),
    },
    {
      id: "actions",
      header: () => <div className="text-right">Actions</div>,
      cell: ({ row }) => {
        const assistant = row.original;
        return (
          <div className="flex items-center justify-end gap-3">
            <Link
              href={`/admin/assistants/${assistant.id}`}
              className="text-blue-600 dark:text-blue-400 hover:text-blue-800 dark:hover:text-blue-300"
              title="View assistant"
            >
              <Eye className="w-4 h-4" />
            </Link>
            <Link
              href={`/admin/assistants/${assistant.id}/edit`}
              className="text-green-600 dark:text-green-400 hover:text-green-800 dark:hover:text-green-300"
              title="Edit assistant & assignments"
            >
              <Edit className="w-4 h-4" />
            </Link>
            <button
              onClick={() =>
                handleDelete(
                  assistant.id,
                  assistant.full_name || assistant.email
                )
              }
              className="text-red-600 dark:text-red-400 hover:text-red-800 dark:hover:text-red-300"
              title="Delete assistant"
            >
              <UserX className="w-4 h-4" />
            </button>
          </div>
        );
      },
    },
  ];

  // Fetch assistants (filter by role=assistant)
  const fetchAssistants = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      // Fetch all practitioners with role filter for assistants
      const data = await practitionerApi.getAll({
        role: "assistant",
        search: searchTerm.trim() || undefined,
      });
      setAssistants(data);
    } catch (err) {
      console.error("Error fetching assistants:", err);
      setError(
        err instanceof Error ? err.message : "Failed to load assistants"
      );
    } finally {
      setLoading(false);
    }
  }, [searchTerm]);

  // Fetch assistants on mount and when filters change
  useEffect(() => {
    fetchAssistants();
  }, [fetchAssistants]);

  // Handle add assistant navigation
  const handleAddAssistant = () => {
    setIsNavigating(true);
    router.push("/admin/assistants/new");
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
            Assistants
          </h1>
          <p className="mt-2 text-gray-600 dark:text-gray-400">
            Manage assistant accounts and practitioner assignments
          </p>
        </div>
        <Button onClick={handleAddAssistant} disabled={isNavigating}>
          {isNavigating ? (
            <>
              <Loader2 className="w-4 h-4 mr-2 animate-spin" />
              Loading...
            </>
          ) : (
            <>
              <Plus className="w-4 h-4 mr-2" />
              Add Assistant
            </>
          )}
        </Button>
      </div>

      {/* Search */}
      <Card>
        <CardContent>
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
            <input
              type="text"
              placeholder="Search assistants by name or email..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white"
            />
          </div>
        </CardContent>
      </Card>

      {/* Loading State */}
      {loading && (
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow border border-gray-200 dark:border-gray-700 p-8 text-center">
          <p className="text-gray-600 dark:text-gray-400">
            Loading assistants...
          </p>
        </div>
      )}

      {/* Error State */}
      {error && (
        <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-4">
          <p className="text-red-800 dark:text-red-400">{error}</p>
        </div>
      )}

      {/* Empty State */}
      {!loading && !error && assistants.length === 0 && (
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow border border-gray-200 dark:border-gray-700 p-8 text-center">
          <p className="text-gray-600 dark:text-gray-400">
            {searchTerm
              ? "No assistants found matching your search"
              : "No assistants yet. Add your first assistant to get started."}
          </p>
        </div>
      )}

      {/* Assistants Table */}
      {!loading && !error && assistants.length > 0 && (
        <DataTable columns={columns} data={assistants} />
      )}
    </div>
  );
}
