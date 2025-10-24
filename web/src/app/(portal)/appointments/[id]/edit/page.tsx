"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { AppointmentForm } from "@/components/portal/appointment-form";
import { appointmentApi, type Appointment } from "@/lib/api/appointment-api";
import { ArrowLeft } from "lucide-react";
import Link from "next/link";

export default function EditAppointmentPage() {
  const params = useParams();
  const router = useRouter();
  const id = params.id as string;

  const [appointment, setAppointment] = useState<Appointment | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchAppointment = async () => {
      try {
        setLoading(true);
        const data = await appointmentApi.getById(id);
        setAppointment(data);
      } catch (err) {
        console.error("Error fetching appointment:", err);
        setError(err instanceof Error ? err.message : "Failed to load appointment");
      } finally {
        setLoading(false);
      }
    };

    if (id) fetchAppointment();
  }, [id]);

  const handleSubmit = async (data: {
    client_id: string;
    start_time: string;
    end_time: string;
    status?: 'scheduled' | 'confirmed' | 'completed' | 'cancelled' | 'no_show';
    notes?: string;
  }) => {
    try {
      await appointmentApi.update(id, data);
      router.push(`/appointments/${id}`);
    } catch (error) {
      console.error("Error updating appointment:", error);
      alert(error instanceof Error ? error.message : "Failed to update appointment");
    }
  };

  if (loading) return <div className="text-center p-8">Loading appointment...</div>;
  if (error || !appointment) return <div className="text-red-600 p-8">{error || "Appointment not found"}</div>;

  // Extract date and time from start_time
  const startDate = new Date(appointment.start_time);
  const date = startDate.toISOString().split('T')[0];
  const time = startDate.toTimeString().slice(0, 5);
  const duration = Math.round((new Date(appointment.end_time).getTime() - startDate.getTime()) / 60000);

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Link href={`/appointments/${id}`} className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg">
          <ArrowLeft className="w-5 h-5" />
        </Link>
        <div>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Edit Appointment</h1>
          <p className="mt-2 text-gray-600 dark:text-gray-400">Update appointment details</p>
        </div>
      </div>

      <AppointmentForm
        defaultValues={{
          client_id: appointment.client_id,
          appointment_type: appointment.appointment_type,
          date,
          time,
          duration,
          status: appointment.status,
          notes: appointment.notes || undefined,
        }}
        onSubmit={handleSubmit}
        submitLabel="Update Appointment"
      />
    </div>
  );
}
