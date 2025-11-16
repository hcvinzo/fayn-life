"use client";

import { Search, Plus, Edit, Eye, Shield, UserX, Loader2 } from "lucide-react";
import { useEffect, useState, useCallback } from "react";
import { practitionerApi } from "@/lib/api/practitioner-api";
import type { PractitionerWithPractice, PractitionerFilters } from "@/types/practitioner";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { ColumnDef } from "@tanstack/react-table";
import { DataTable } from "@/components/ui/data-table";
import { Card, CardContent } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Button } from "@/components/ui/button";

/**
 * Practitioners Admin Page
 * Displays list of all practitioners with search and filter capabilities
 */
export default function PractitionersAdminPage() {
  const router = useRouter();
  const [practitioners, setPractitioners] = useState<PractitionerWithPractice[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState<PractitionerFilters["status"] | "all">("all");
  const [roleFilter, setRoleFilter] = useState<PractitionerFilters["role"] | "all">("all");
  const [isNavigating, setIsNavigating] = useState(false);

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

  // Role badge color helper
  const getRoleColor = (role: string) => {
    switch (role) {
      case "admin":
        return "bg-purple-100 dark:bg-purple-900/20 text-purple-800 dark:text-purple-400";
      case "practitioner":
        return "bg-blue-100 dark:bg-blue-900/20 text-blue-800 dark:text-blue-400";
      case "staff":
        return "bg-cyan-100 dark:bg-cyan-900/20 text-cyan-800 dark:text-cyan-400";
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

  // Delete practitioner handler
  const handleDelete = async (id: string, practitionerName: string) => {
    if (!confirm(`Are you sure you want to delete ${practitionerName}? This action cannot be undone.`)) {
      return;
    }

    try {
      await practitionerApi.delete(id);
      fetchPractitioners(); // Refresh list
    } catch (err) {
      console.error("Error deleting practitioner:", err);
      alert("Failed to delete practitioner");
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
      accessorKey: "role",
      header: "Role",
      cell: ({ row }) => {
        const role = row.getValue("role") as string;
        return (
          <span
            className={`px-2 py-1 text-xs font-medium rounded-full ${getRoleColor(
              role
            )}`}
          >
            {role.charAt(0).toUpperCase() + role.slice(1)}
          </span>
        );
      },
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
        const practitioner = row.original;
        return (
          <div className="flex items-center justify-end gap-3">
            <Link
              href={`/admin/practitioners/${practitioner.id}`}
              className="text-blue-600 dark:text-blue-400 hover:text-blue-800 dark:hover:text-blue-300"
              title="View practitioner"
            >
              <Eye className="w-4 h-4" />
            </Link>
            <Link
              href={`/admin/practitioners/${practitioner.id}/edit`}
              className="text-green-600 dark:text-green-400 hover:text-green-800 dark:hover:text-green-300"
              title="Edit practitioner"
            >
              <Edit className="w-4 h-4" />
            </Link>
            <button
              onClick={() => handleDelete(practitioner.id, practitioner.full_name || practitioner.email)}
              className="text-red-600 dark:text-red-400 hover:text-red-800 dark:hover:text-red-300"
              title="Delete practitioner"
            >
              <UserX className="w-4 h-4" />
            </button>
          </div>
        );
      },
    },
  ];

  // Fetch practitioners
  const fetchPractitioners = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      const filters: PractitionerFilters = {};
      if (statusFilter && statusFilter !== "all") {
        filters.status = statusFilter;
      }
      if (roleFilter && roleFilter !== "all") {
        filters.role = roleFilter;
      }
      if (searchTerm.trim()) {
        filters.search = searchTerm.trim();
      }

      const data = await practitionerApi.getAll(filters);
      setPractitioners(data);
    } catch (err) {
      console.error("Error fetching practitioners:", err);
      setError(err instanceof Error ? err.message : "Failed to load practitioners");
    } finally {
      setLoading(false);
    }
  }, [statusFilter, roleFilter, searchTerm]);

  // Fetch practitioners on mount and when filters change
  useEffect(() => {
    fetchPractitioners();
  }, [fetchPractitioners]);

  // Handle add practitioner navigation
  const handleAddPractitioner = () => {
    setIsNavigating(true);
    router.push("/admin/practitioners/new");
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
            Practitioners
          </h1>
          <p className="mt-2 text-gray-600 dark:text-gray-400">
            Manage practitioner accounts and permissions
          </p>
        </div>
        <Button
          onClick={handleAddPractitioner}
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
              Add Practitioner
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
                placeholder="Search practitioners by name or email..."
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
                <SelectItem value="blocked">Blocked</SelectItem>
                <SelectItem value="pending">Pending</SelectItem>
              </SelectContent>
            </Select>
            <Select
              value={roleFilter}
              onValueChange={(value) => setRoleFilter(value as any)}
            >
              <SelectTrigger className="w-[180px]">
                <SelectValue placeholder="All Roles" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Roles</SelectItem>
                <SelectItem value="practitioner">Practitioner</SelectItem>
                <SelectItem value="staff">Staff</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Loading State */}
      {loading && (
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow border border-gray-200 dark:border-gray-700 p-8 text-center">
          <p className="text-gray-600 dark:text-gray-400">Loading practitioners...</p>
        </div>
      )}

      {/* Error State */}
      {error && (
        <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-4">
          <p className="text-red-800 dark:text-red-400">{error}</p>
        </div>
      )}

      {/* Empty State */}
      {!loading && !error && practitioners.length === 0 && (
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow border border-gray-200 dark:border-gray-700 p-8 text-center">
          <p className="text-gray-600 dark:text-gray-400">
            {searchTerm || statusFilter !== "all" || roleFilter !== "all"
              ? "No practitioners found matching your filters"
              : "No practitioners yet. Add your first practitioner to get started."}
          </p>
        </div>
      )}

      {/* Practitioners Table */}
      {!loading && !error && practitioners.length > 0 && (
        <DataTable columns={columns} data={practitioners} />
      )}
    </div>
  );
}
