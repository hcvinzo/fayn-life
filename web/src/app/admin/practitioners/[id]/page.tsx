"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { practitionerApi } from "@/lib/api/practitioner-api";
import type { PractitionerWithPractice } from "@/types/practitioner";
import { ArrowLeft, Edit, Mail, UserX, Loader2, Shield, Building2, Calendar } from "lucide-react";
import Link from "next/link";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";

/**
 * Practitioner Details Page
 * View full practitioner information
 */
export default function PractitionerDetailsPage() {
  const params = useParams();
  const router = useRouter();
  const id = params.id as string;

  const [practitioner, setPractitioner] = useState<PractitionerWithPractice | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [navigatingToEdit, setNavigatingToEdit] = useState(false);

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

  const handleDelete = async () => {
    if (
      !practitioner ||
      !confirm(
        `Are you sure you want to delete ${practitioner.full_name || practitioner.email}? This action cannot be undone.`
      )
    ) {
      return;
    }

    try {
      await practitionerApi.delete(id);
      router.push("/admin/practitioners");
    } catch (err) {
      console.error("Error deleting practitioner:", err);
      alert("Failed to delete practitioner");
    }
  };

  const handleEdit = () => {
    setNavigatingToEdit(true);
    router.push(`/admin/practitioners/${id}/edit`);
  };

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

  const formatDateTime = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <p className="text-gray-600 dark:text-gray-400">Loading practitioner details...</p>
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
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Link
            href="/admin/practitioners"
            className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
          >
            <ArrowLeft className="w-5 h-5 text-gray-600 dark:text-gray-400" />
          </Link>
          <div>
            <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
              {practitioner.full_name || practitioner.email}
            </h1>
            <p className="mt-2 text-gray-600 dark:text-gray-400">Practitioner Details</p>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <Button variant="default" size="sm" onClick={handleEdit} disabled={navigatingToEdit}>
            {navigatingToEdit ? (
              <>
                <Loader2 className="w-4 h-4 mr-1 animate-spin" />
                Loading...
              </>
            ) : (
              <>
                <Edit className="w-4 h-4 mr-1" />
                Edit
              </>
            )}
          </Button>
          <Button variant="destructive" size="sm" onClick={handleDelete}>
            <UserX className="w-4 h-4 mr-1" />
            Delete
          </Button>
        </div>
      </div>

      {/* Practitioner Information */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Main Information */}
        <div className="lg:col-span-2 space-y-6">
          {/* Account Details */}
          <Card>
            <CardHeader>
              <CardTitle>Account Information</CardTitle>
              <CardDescription>Practitioner account details and permissions</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <p className="text-sm text-gray-600 dark:text-gray-400 mb-1">Full Name</p>
                  <p className="text-gray-900 dark:text-white font-medium">
                    {practitioner.full_name || "-"}
                  </p>
                </div>

                <div>
                  <p className="text-sm text-gray-600 dark:text-gray-400 mb-1">Email</p>
                  <div className="flex items-center gap-2">
                    <Mail className="w-4 h-4 text-gray-400" />
                    <a
                      href={`mailto:${practitioner.email}`}
                      className="text-blue-600 dark:text-blue-400 hover:underline"
                    >
                      {practitioner.email}
                    </a>
                  </div>
                </div>

                <div>
                  <p className="text-sm text-gray-600 dark:text-gray-400 mb-1">Role</p>
                  <span
                    className={`inline-flex px-2 py-1 text-xs font-medium rounded-full ${getRoleColor(
                      practitioner.role
                    )}`}
                  >
                    <Shield className="w-3 h-3 mr-1" />
                    {practitioner.role.charAt(0).toUpperCase() + practitioner.role.slice(1)}
                  </span>
                </div>

                <div>
                  <p className="text-sm text-gray-600 dark:text-gray-400 mb-1">Status</p>
                  <span
                    className={`inline-flex px-2 py-1 text-xs font-medium rounded-full ${getStatusColor(
                      practitioner.status
                    )}`}
                  >
                    {practitioner.status.charAt(0).toUpperCase() + practitioner.status.slice(1)}
                  </span>
                </div>

                <div className="md:col-span-2">
                  <p className="text-sm text-gray-600 dark:text-gray-400 mb-1">Practice</p>
                  <div className="flex items-center gap-2">
                    <Building2 className="w-4 h-4 text-gray-400" />
                    <p className="text-gray-900 dark:text-white font-medium">
                      {practitioner.practice?.name || "Not assigned to a practice"}
                    </p>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          {/* Metadata */}
          <Card>
            <CardHeader>
              <CardTitle>Metadata</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                <div>
                  <p className="text-sm text-gray-600 dark:text-gray-400 mb-1">User ID</p>
                  <p className="text-xs text-gray-900 dark:text-white font-mono bg-gray-50 dark:bg-gray-900 p-2 rounded">
                    {practitioner.id}
                  </p>
                </div>
                <div>
                  <p className="text-sm text-gray-600 dark:text-gray-400 mb-1">
                    <Calendar className="w-3 h-3 inline mr-1" />
                    Created
                  </p>
                  <p className="text-sm text-gray-900 dark:text-white">
                    {formatDateTime(practitioner.created_at)}
                  </p>
                </div>
                <div>
                  <p className="text-sm text-gray-600 dark:text-gray-400 mb-1">
                    <Calendar className="w-3 h-3 inline mr-1" />
                    Last Updated
                  </p>
                  <p className="text-sm text-gray-900 dark:text-white">
                    {formatDateTime(practitioner.updated_at)}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Quick Actions */}
          <Card>
            <CardHeader>
              <CardTitle>Quick Actions</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                <a
                  href={`mailto:${practitioner.email}`}
                  className="flex items-center gap-2 px-4 py-2 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700 rounded-lg transition-colors"
                >
                  <Mail className="w-4 h-4" />
                  Send Email
                </a>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
