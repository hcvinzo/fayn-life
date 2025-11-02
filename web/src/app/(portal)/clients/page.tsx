"use client";

import { Search, Plus, Edit, Eye, Archive } from "lucide-react";
import { useEffect, useState, useCallback } from "react";
import { clientApi, type Client, type ClientFilters } from "@/lib/api/client-api";
import Link from "next/link";
import { ColumnDef } from "@tanstack/react-table";
import { DataTable } from "@/components/ui/data-table";
import { Card, CardContent } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

/**
 * Clients page
 * Displays list of all clients with search and filter capabilities
 */
export default function ClientsPage() {
  const [clients, setClients] = useState<Client[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState<ClientFilters["status"] | "all">("all");

  // Status badge color helper
  const getStatusColor = (status: string) => {
    switch (status) {
      case "active":
        return "bg-green-100 dark:bg-green-900/20 text-green-800 dark:text-green-400";
      case "inactive":
        return "bg-yellow-100 dark:bg-yellow-900/20 text-yellow-800 dark:text-yellow-400";
      case "archived":
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

  // Archive client handler
  const handleArchive = async (id: string, clientName: string) => {
    if (!confirm(`Are you sure you want to archive ${clientName}?`)) {
      return;
    }

    try {
      await clientApi.archive(id);
      fetchClients(); // Refresh list
    } catch (err) {
      console.error("Error archiving client:", err);
      alert("Failed to archive client");
    }
  };

  // Column definitions for DataTable
  const columns: ColumnDef<Client>[] = [
    {
      accessorKey: "full_name",
      header: "Name",
      cell: ({ row }) => (
        <div className="text-sm font-medium text-gray-900 dark:text-white">
          {row.getValue("full_name")}
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
      accessorKey: "phone",
      header: "Phone",
      cell: ({ row }) => (
        <div className="text-sm text-gray-600 dark:text-gray-400">
          {row.getValue("phone") || "-"}
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
        const client = row.original;
        return (
          <div className="flex items-center justify-end gap-3">
            <Link
              href={`/clients/${client.id}`}
              className="text-blue-600 dark:text-blue-400 hover:text-blue-800 dark:hover:text-blue-300"
              title="View client"
            >
              <Eye className="w-4 h-4" />
            </Link>
            <Link
              href={`/clients/${client.id}/edit`}
              className="text-green-600 dark:text-green-400 hover:text-green-800 dark:hover:text-green-300"
              title="Edit client"
            >
              <Edit className="w-4 h-4" />
            </Link>
            {client.status !== "archived" && (
              <button
                onClick={() => handleArchive(client.id, client.full_name)}
                className="text-gray-600 dark:text-gray-400 hover:text-gray-800 dark:hover:text-gray-300"
                title="Archive client"
              >
                <Archive className="w-4 h-4" />
              </button>
            )}
          </div>
        );
      },
    },
  ];

  // Fetch clients
  const fetchClients = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      const filters: ClientFilters = {};
      if (statusFilter && statusFilter !== "all") {
        filters.status = statusFilter;
      }
      if (searchTerm.trim()) {
        filters.search = searchTerm.trim();
      }

      const data = await clientApi.getAll(filters);
      setClients(data);
    } catch (err) {
      console.error("Error fetching clients:", err);
      setError(err instanceof Error ? err.message : "Failed to load clients");
    } finally {
      setLoading(false);
    }
  }, [statusFilter, searchTerm]);

  // Fetch clients on mount and when filters change
  useEffect(() => {
    fetchClients();
  }, [fetchClients]);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
            Clients
          </h1>
          <p className="mt-2 text-gray-600 dark:text-gray-400">
            Manage your client database
          </p>
        </div>
        <Link
          href="/clients/new"
          className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
        >
          <Plus className="w-4 h-4" />
          Add Client
        </Link>
      </div>

      {/* Search and Filters */}
      <Card>
        <CardContent>
          <div className="flex items-center gap-4">
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
              <input
                type="text"
                placeholder="Search clients by name or email..."
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
                <SelectItem value="inactive">Inactive</SelectItem>
                <SelectItem value="archived">Archived</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Loading State */}
      {loading && (
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow border border-gray-200 dark:border-gray-700 p-8 text-center">
          <p className="text-gray-600 dark:text-gray-400">Loading clients...</p>
        </div>
      )}

      {/* Error State */}
      {error && (
        <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-4">
          <p className="text-red-800 dark:text-red-400">{error}</p>
        </div>
      )}

      {/* Empty State */}
      {!loading && !error && clients.length === 0 && (
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow border border-gray-200 dark:border-gray-700 p-8 text-center">
          <p className="text-gray-600 dark:text-gray-400">
            {searchTerm || statusFilter !== "all"
              ? "No clients found matching your filters"
              : "No clients yet. Add your first client to get started."}
          </p>
        </div>
      )}

      {/* Clients Table */}
      {!loading && !error && clients.length > 0 && (
        <DataTable columns={columns} data={clients} />
      )}
    </div>
  );
}
