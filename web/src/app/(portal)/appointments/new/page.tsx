"use client";

import { useRouter } from "next/navigation";
import { AppointmentForm } from "@/components/portal/appointment-form";
import { appointmentApi } from "@/lib/api/appointment-api";
import { ArrowLeft } from "lucide-react";
import Link from "next/link";

export default function NewAppointmentPage() {
  const router = useRouter();

  const handleSubmit = async (data: {
    client_id: string;
    start_time: string;
    end_time: string;
    status?: 'scheduled' | 'confirmed' | 'completed' | 'cancelled' | 'no_show';
    notes?: string;
  }) => {
    try {
      await appointmentApi.create(data);
      router.push("/appointments");
    } catch (error) {
      console.error("Error creating appointment:", error);
      alert(error instanceof Error ? error.message : "Failed to create appointment");
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Link
          href="/appointments"
          className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
        >
          <ArrowLeft className="w-5 h-5 text-gray-600 dark:text-gray-400" />
        </Link>
        <div>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
            New Appointment
          </h1>
          <p className="mt-2 text-gray-600 dark:text-gray-400">
            Schedule a new appointment
          </p>
        </div>
      </div>

      <AppointmentForm onSubmit={handleSubmit} submitLabel="Create Appointment" />
    </div>
  );
}
