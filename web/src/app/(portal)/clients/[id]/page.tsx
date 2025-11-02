"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { clientApi, type Client } from "@/lib/api/client-api";
import { ArrowLeft, Edit, Archive, Mail, Phone, Calendar, FileText } from "lucide-react";
import Link from "next/link";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";

/**
 * Client Details Page
 * View full client information
 */
export default function ClientDetailsPage() {
  const params = useParams();
  const router = useRouter();
  const id = params.id as string;

  const [client, setClient] = useState<Client | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchClient = async () => {
      try {
        setLoading(true);
        setError(null);
        const data = await clientApi.getById(id);
        setClient(data);
      } catch (err) {
        console.error("Error fetching client:", err);
        setError(err instanceof Error ? err.message : "Failed to load client");
      } finally {
        setLoading(false);
      }
    };

    if (id) {
      fetchClient();
    }
  }, [id]);

  const handleArchive = async () => {
    if (!client || !confirm(`Are you sure you want to archive ${client.full_name}?`)) {
      return;
    }

    try {
      await clientApi.archive(id);
      router.push("/clients");
    } catch (err) {
      console.error("Error archiving client:", err);
      alert("Failed to archive client");
    }
  };

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

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("en-US", {
      year: "numeric",
      month: "long",
      day: "numeric",
    });
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
        <p className="text-gray-600 dark:text-gray-400">Loading client details...</p>
      </div>
    );
  }

  if (error || !client) {
    return (
      <div className="space-y-6">
        <div className="flex items-center gap-4">
          <Link
            href="/clients"
            className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
          >
            <ArrowLeft className="w-5 h-5 text-gray-600 dark:text-gray-400" />
          </Link>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
            Client Not Found
          </h1>
        </div>
        <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-4">
          <p className="text-red-800 dark:text-red-400">
            {error || "Client not found"}
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
            href="/clients"
            className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
          >
            <ArrowLeft className="w-5 h-5 text-gray-600 dark:text-gray-400" />
          </Link>
          <div>
            <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
              {client.full_name}
            </h1>
            <p className="mt-2 text-gray-600 dark:text-gray-400">
              Client Details
            </p>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <Button variant="default" size="sm" className="hidden md:flex" onClick={() => router.push(`/clients/${id}/edit`)}>
            Edit
          </Button>
          {client.status !== "archived" && (
            <Button variant="destructive" size="sm" className="hidden md:flex" onClick={handleArchive}>
              <Archive className="w-4 h-4" />
              Archive
            </Button>
          )}
        </div>
      </div>

      {/* Client Information */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Main Information */}
        <div className="lg:col-span-2 space-y-6">
          {/* Personal Details */}
          <Card>
            <CardHeader>
              <CardTitle>
                <div className="flex items-center gap-2">
                  {client.first_name} {client.last_name}
                </div>
              </CardTitle>
              <CardDescription>
                Hasta Bilgileri
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">

                {client.email && (
                  <div>
                    <p className="text-sm text-gray-600 dark:text-gray-400 mb-1">
                      Email
                    </p>
                    <div className="flex items-center gap-2">
                      <Mail className="w-4 h-4 text-gray-400" />
                      <a
                        href={`mailto:${client.email}`}
                        className="text-blue-600 dark:text-blue-400 hover:underline"
                      >
                        {client.email}
                      </a>
                    </div>
                  </div>
                )}
                {client.phone && (
                  <div>
                    <p className="text-sm text-gray-600 dark:text-gray-400 mb-1">
                      Phone
                    </p>
                    <div className="flex items-center gap-2">
                      <Phone className="w-4 h-4 text-gray-400" />
                      <a
                        href={`tel:${client.phone}`}
                        className="text-blue-600 dark:text-blue-400 hover:underline"
                      >
                        {client.phone}
                      </a>
                    </div>
                  </div>
                )}
                {client.date_of_birth && (
                  <div>
                    <p className="text-sm text-gray-600 dark:text-gray-400 mb-1">
                      Date of Birth
                    </p>
                    <div className="flex items-center gap-2">
                      <Calendar className="w-4 h-4 text-gray-400" />
                      <p className="text-gray-900 dark:text-white font-medium">
                        {formatDate(client.date_of_birth)}
                      </p>
                    </div>
                  </div>
                )}
                <div>
                  <p className="text-sm text-gray-600 dark:text-gray-400 mb-1">
                    Status
                  </p>
                  <span
                    className={`inline-flex px-2 py-1 text-xs font-medium rounded-full ${getStatusColor(
                      client.status
                    )}`}
                  >
                    {client.status.charAt(0).toUpperCase() + client.status.slice(1)}
                  </span>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Notes */}
          {client.notes && (
            <Card>
              <CardHeader>
                <CardTitle>
                  <div className="flex items-center gap-2">
                    <FileText className="w-5 h-5" />
                    Notes
                  </div>
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="whitespace-pre-wrap text-gray-900 dark:text-white">
                  {client.notes}
                </p>
              </CardContent>
            </Card>
          )}
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          {/* Metadata */}
          <Card>
            <CardHeader>
              <CardTitle>
                <div className="flex items-center gap-2">
                  Metadata
                </div>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                <div>
                  <p className="text-sm text-gray-600 dark:text-gray-400 mb-1">
                    Client ID
                  </p>
                  <p className="text-xs text-gray-900 dark:text-white font-mono bg-gray-50 dark:bg-gray-900 p-2 rounded">
                    {client.id}
                  </p>
                </div>
                <div>
                  <p className="text-sm text-gray-600 dark:text-gray-400 mb-1">
                    Created
                  </p>
                  <p className="text-sm text-gray-900 dark:text-white">
                    {formatDateTime(client.created_at)}
                  </p>
                </div>
                <div>
                  <p className="text-sm text-gray-600 dark:text-gray-400 mb-1">
                    Last Updated
                  </p>
                  <p className="text-sm text-gray-900 dark:text-white">
                    {formatDateTime(client.updated_at)}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Quick Actions */}
          <Card>
            <CardHeader>
              <CardTitle>
                <div className="flex items-center gap-2">
                  Quick Actions
                </div>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                {client.email && (
                  <a
                    href={`mailto:${client.email}`}
                    className="flex items-center gap-2 px-4 py-2 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700 rounded-lg transition-colors"
                  >
                    <Mail className="w-4 h-4" />
                    Send Email
                  </a>
                )}
                {client.phone && (
                  <a
                    href={`tel:${client.phone}`}
                    className="flex items-center gap-2 px-4 py-2 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700 rounded-lg transition-colors"
                  >
                    <Phone className="w-4 h-4" />
                    Call Client
                  </a>
                )}
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
