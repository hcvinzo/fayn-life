"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { adminPracticeApi } from "@/lib/api/practice-api";
import type { Practice } from "@/types/practice";
import { ArrowLeft, Edit, Mail, Phone, MapPin, Trash2, Loader2, Building2 } from "lucide-react";
import Link from "next/link";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";

export default function PracticeDetailsPage() {
  const params = useParams();
  const router = useRouter();
  const id = params.id as string;

  const [practice, setPractice] = useState<Practice | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [navigatingToEdit, setNavigatingToEdit] = useState(false);

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

  const handleDelete = async () => {
    if (
      !practice ||
      !confirm(
        `Are you sure you want to delete ${practice.name}? This action cannot be undone.`
      )
    ) {
      return;
    }

    try {
      await adminPracticeApi.delete(id);
      router.push("/admin/practices");
    } catch (err) {
      console.error("Error deleting practice:", err);
      alert("Failed to delete practice");
    }
  };

  const handleEdit = () => {
    setNavigatingToEdit(true);
    router.push(`/admin/practices/${id}/edit`);
  };

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
        <p className="text-gray-600 dark:text-gray-400">Loading practice details...</p>
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
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Link
            href="/admin/practices"
            className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
          >
            <ArrowLeft className="w-5 h-5 text-gray-600 dark:text-gray-400" />
          </Link>
          <div>
            <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
              {practice.name}
            </h1>
            <p className="mt-2 text-gray-600 dark:text-gray-400">Practice Details</p>
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
            <Trash2 className="w-4 h-4 mr-1" />
            Delete
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2">
          <Card>
            <CardHeader>
              <CardTitle>Practice Information</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="md:col-span-2">
                  <p className="text-sm text-gray-600 dark:text-gray-400 mb-1">Name</p>
                  <div className="flex items-center gap-2">
                    <Building2 className="w-4 h-4 text-gray-400" />
                    <p className="text-gray-900 dark:text-white font-medium">
                      {practice.name}
                    </p>
                  </div>
                </div>

                {practice.address && (
                  <div className="md:col-span-2">
                    <p className="text-sm text-gray-600 dark:text-gray-400 mb-1">Address</p>
                    <div className="flex items-center gap-2">
                      <MapPin className="w-4 h-4 text-gray-400" />
                      <p className="text-gray-900 dark:text-white">{practice.address}</p>
                    </div>
                  </div>
                )}

                {practice.phone && (
                  <div>
                    <p className="text-sm text-gray-600 dark:text-gray-400 mb-1">Phone</p>
                    <div className="flex items-center gap-2">
                      <Phone className="w-4 h-4 text-gray-400" />
                      <a
                        href={`tel:${practice.phone}`}
                        className="text-blue-600 dark:text-blue-400 hover:underline"
                      >
                        {practice.phone}
                      </a>
                    </div>
                  </div>
                )}

                {practice.email && (
                  <div>
                    <p className="text-sm text-gray-600 dark:text-gray-400 mb-1">Email</p>
                    <div className="flex items-center gap-2">
                      <Mail className="w-4 h-4 text-gray-400" />
                      <a
                        href={`mailto:${practice.email}`}
                        className="text-blue-600 dark:text-blue-400 hover:underline"
                      >
                        {practice.email}
                      </a>
                    </div>
                  </div>
                )}

                <div>
                  <p className="text-sm text-gray-600 dark:text-gray-400 mb-1">Status</p>
                  <span
                    className={`inline-flex px-2 py-1 text-xs font-medium rounded-full ${getStatusColor(
                      practice.status
                    )}`}
                  >
                    {practice.status.charAt(0).toUpperCase() + practice.status.slice(1)}
                  </span>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        <div>
          <Card>
            <CardHeader>
              <CardTitle>Metadata</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                <div>
                  <p className="text-sm text-gray-600 dark:text-gray-400 mb-1">Practice ID</p>
                  <p className="text-xs text-gray-900 dark:text-white font-mono bg-gray-50 dark:bg-gray-900 p-2 rounded">
                    {practice.id}
                  </p>
                </div>
                <div>
                  <p className="text-sm text-gray-600 dark:text-gray-400 mb-1">Created</p>
                  <p className="text-sm text-gray-900 dark:text-white">
                    {formatDateTime(practice.created_at)}
                  </p>
                </div>
                <div>
                  <p className="text-sm text-gray-600 dark:text-gray-400 mb-1">Last Updated</p>
                  <p className="text-sm text-gray-900 dark:text-white">
                    {formatDateTime(practice.updated_at)}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
