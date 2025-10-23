"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { ClientForm } from "@/components/portal/client-form";
import { clientApi, type Client } from "@/lib/api/client-api";
import { ArrowLeft } from "lucide-react";
import Link from "next/link";

/**
 * Edit Client Page
 * Edit existing client information
 */
export default function EditClientPage() {
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

  const handleSubmit = async (data: Record<string, unknown>) => {
    try {
      await clientApi.update(id, data);
      router.push(`/clients/${id}`);
    } catch (error) {
      console.error("Error updating client:", error);
      alert(error instanceof Error ? error.message : "Failed to update client");
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <p className="text-gray-600 dark:text-gray-400">Loading client...</p>
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
      <div className="flex items-center gap-4">
        <Link
          href={`/clients/${id}`}
          className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
        >
          <ArrowLeft className="w-5 h-5 text-gray-600 dark:text-gray-400" />
        </Link>
        <div>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
            Edit Client
          </h1>
          <p className="mt-2 text-gray-600 dark:text-gray-400">
            Update {client.full_name}&apos;s information
          </p>
        </div>
      </div>

      {/* Form */}
      <ClientForm
        defaultValues={{
          first_name: client.first_name,
          last_name: client.last_name,
          email: client.email || undefined,
          phone: client.phone || undefined,
          date_of_birth: client.date_of_birth || undefined,
          status: client.status,
          notes: client.notes || undefined,
        }}
        onSubmit={handleSubmit}
        submitLabel="Update Client"
      />
    </div>
  );
}
