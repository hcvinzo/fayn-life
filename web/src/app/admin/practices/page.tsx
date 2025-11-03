"use client";

import { Search, Plus, Edit, Eye, Building2, Trash2, Loader2 } from "lucide-react";
import { useEffect, useState, useCallback } from "react";
import { adminPracticeApi } from "@/lib/api/practice-api";
import type { Practice, PracticeFilters } from "@/types/practice";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { ColumnDef } from "@tanstack/react-table";
import { DataTable } from "@/components/ui/data-table";
import { Card, CardContent } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Button } from "@/components/ui/button";

/**
 * Practices Admin Page
 * Displays list of all practices with search and filter capabilities
 */
export default function PracticesAdminPage() {
  const router = useRouter();
  const [practices, setPractices] = useState<Practice[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState<PracticeFilters["status"] | "all">("all");
  const [isNavigating, setIsNavigating] = useState(false);

  // Status badge color helper
  const getStatusColor = (status: string) => {
    switch (status) {
      case "active":
        return "bg-green-100 dark:bg-green-900/20 text-green-800 dark:text-green-400";
      case "suspended":
        return "bg-yellow-100 dark:bg-yellow-900/20 text-yellow-800 dark:text-yellow-400";
      case "inactive":
        return "bg-gray-100 dark:bg-gray-900/20 text-gray-800 dark:text-gray-400";
      default:
        return "bg-gray-100 dark:bg-gray-900/20 text-gray-800 dark:text-gray-400";
    }
  };

  // Format date helper
  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
    });
  };

  // Delete practice handler
  const handleDelete = async (id: string, practiceName: string) => {
    if (!confirm(`Are you sure you want to delete ${practiceName}? This action cannot be undone.`)) {
      return;
    }

    try {
      await adminPracticeApi.delete(id);
      fetchPractices(); // Refresh list
    } catch (err) {
      console.error("Error deleting practice:", err);
      alert("Failed to delete practice");
    }
  };

  // Column definitions for DataTable
  const columns: ColumnDef<Practice>[] = [
    {
      accessorKey: "name",
      header: "Name",
      cell: ({ row }) => (
        <div className="text-sm font-medium text-gray-900 dark:text-white">
          {row.getValue("name")}
        </div>
      ),
    },
    {
      accessorKey: "address",
      header: "Address",
      cell: ({ row }) => (
        <div className="text-sm text-gray-600 dark:text-gray-400">
          {row.getValue("address") || "-"}
        </div>
      ),
    },
    {
      accessorKey: "phone",
      header: "Phone",
      cell: ({ row }) => (
        <div className="text-sm text-gray-600 dark:text-gray-400">
          {row.getValue("phone") || "-"}
        </div>
      ),
    },
    {
      accessorKey: "email",
      header: "Email",
      cell: ({ row }) => (
        <div className="text-sm text-gray-600 dark:text-gray-400">
          {row.getValue("email") || "-"}
        </div>
      ),
    },
    {
      accessorKey: "status",
      header: "Status",
      cell: ({ row }) => {
        const status = row.getValue("status") as string;
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
        const practice = row.original;
        return (
          <div className="flex items-center justify-end gap-3">
            <Link
              href={`/admin/practices/${practice.id}`}
              className="text-blue-600 dark:text-blue-400 hover:text-blue-800 dark:hover:text-blue-300"
              title="View practice"
            >
              <Eye className="w-4 h-4" />
            </Link>
            <Link
              href={`/admin/practices/${practice.id}/edit`}
              className="text-green-600 dark:text-green-400 hover:text-green-800 dark:hover:text-green-300"
              title="Edit practice"
            >
              <Edit className="w-4 h-4" />
            </Link>
            <button
              onClick={() => handleDelete(practice.id, practice.name)}
              className="text-red-600 dark:text-red-400 hover:text-red-800 dark:hover:text-red-300"
              title="Delete practice"
            >
              <Trash2 className="w-4 h-4" />
            </button>
          </div>
        );
      },
    },
  ];

  // Fetch practices
  const fetchPractices = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      const filters: PracticeFilters = {};
      if (statusFilter && statusFilter !== "all") {
        filters.status = statusFilter;
      }
      if (searchTerm.trim()) {
        filters.search = searchTerm.trim();
      }

      const data = await adminPracticeApi.getAll(filters);
      setPractices(data);
    } catch (err) {
      console.error("Error fetching practices:", err);
      setError(err instanceof Error ? err.message : "Failed to load practices");
    } finally {
      setLoading(false);
    }
  }, [statusFilter, searchTerm]);

  // Fetch practices on mount and when filters change
  useEffect(() => {
    fetchPractices();
  }, [fetchPractices]);

  // Handle add practice navigation
  const handleAddPractice = () => {
    setIsNavigating(true);
    router.push("/admin/practices/new");
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
            Practices
          </h1>
          <p className="mt-2 text-gray-600 dark:text-gray-400">
            Manage practice organizations and locations
          </p>
        </div>
        <Button
          onClick={handleAddPractice}
          disabled={isNavigating}
        >
          {isNavigating ? (
            <>
              <Loader2 className="w-4 h-4 mr-2 animate-spin" />
              Loading...
            </>
          ) : (
            <>
              <Plus className="w-4 h-4 mr-2" />
              Add Practice
            </>
          )}
        </Button>
      </div>

      {/* Search and Filters */}
      <Card>
        <CardContent>
          <div className="flex items-center gap-4">
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
              <input
                type="text"
                placeholder="Search practices by name..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white"
              />
            </div>
            <Select
              value={statusFilter}
              onValueChange={(value) => setStatusFilter(value as any)}
            >
              <SelectTrigger className="w-[180px]">
                <SelectValue placeholder="All Status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Status</SelectItem>
                <SelectItem value="active">Active</SelectItem>
                <SelectItem value="suspended">Suspended</SelectItem>
                <SelectItem value="inactive">Inactive</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Loading State */}
      {loading && (
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow border border-gray-200 dark:border-gray-700 p-8 text-center">
          <p className="text-gray-600 dark:text-gray-400">Loading practices...</p>
        </div>
      )}

      {/* Error State */}
      {error && (
        <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-4">
          <p className="text-red-800 dark:text-red-400">{error}</p>
        </div>
      )}

      {/* Empty State */}
      {!loading && !error && practices.length === 0 && (
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow border border-gray-200 dark:border-gray-700 p-8 text-center">
          <p className="text-gray-600 dark:text-gray-400">
            {searchTerm || statusFilter !== "all"
              ? "No practices found matching your filters"
              : "No practices yet. Add your first practice to get started."}
          </p>
        </div>
      )}

      {/* Practices Table */}
      {!loading && !error && practices.length > 0 && (
        <DataTable columns={columns} data={practices} />
      )}
    </div>
  );
}
