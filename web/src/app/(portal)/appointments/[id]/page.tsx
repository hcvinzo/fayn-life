"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { appointmentApi, type Appointment } from "@/lib/api/appointment-api";
import { clientApi, type Client } from "@/lib/api/client-api";
import { sessionApi } from "@/lib/api/session-api";
import type { SessionWithDetails } from "@/types/session";
import { SessionDetails } from "@/components/portal/session-details";
import { ArrowLeft, Edit, XCircle, Calendar, Clock, User, FileText, PlayCircle } from "lucide-react";
import Link from "next/link";

export default function AppointmentDetailsPage() {
  const params = useParams();
  const router = useRouter();
  const id = params.id as string;

  const [appointment, setAppointment] = useState<Appointment | null>(null);
  const [client, setClient] = useState<Client | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [session, setSession] = useState<SessionWithDetails | null>(null);
  const [startingSession, setStartingSession] = useState(false);

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        const appointmentData = await appointmentApi.getById(id);
        setAppointment(appointmentData);

        const clientData = await clientApi.getById(appointmentData.client_id);
        setClient(clientData);

        // Check if appointment has a session
        try {
          const sessionData = await sessionApi.getByAppointment(id);
          if (sessionData) {
            // Load full session details with client info
            const fullSessionData = await sessionApi.getById(sessionData.id);
            setSession(fullSessionData);
          }
        } catch (err) {
          // No session found, which is fine
          setSession(null);
        }
      } catch (err) {
        console.error("Error:", err);
        setError(err instanceof Error ? err.message : "Failed to load appointment");
      } finally {
        setLoading(false);
      }
    };

    if (id) fetchData();
  }, [id]);

  const handleCancel = async () => {
    if (!appointment || !confirm("Are you sure you want to cancel this appointment?")) return;

    try {
      await appointmentApi.cancel(id);
      router.push("/appointments");
    } catch (err) {
      alert("Failed to cancel appointment");
    }
  };

  const handleStartSession = async () => {
    if (!appointment || !client) return;

    try {
      setStartingSession(true);
      const newSession = await sessionApi.create({
        practice_id: appointment.practice_id,
        appointment_id: appointment.id,
        client_id: appointment.client_id,
        practitioner_id: appointment.practitioner_id,
      });
      // Load full session details with client info
      const fullSessionData = await sessionApi.getById(newSession.id);
      setSession(fullSessionData);
    } catch (err) {
      console.error("Failed to start session:", err);
      alert("Failed to start session. Make sure the appointment is confirmed.");
    } finally {
      setStartingSession(false);
    }
  };

  const handleSessionUpdate = async () => {
    // Reload appointment and session data
    if (id) {
      try {
        const appointmentData = await appointmentApi.getById(id);
        setAppointment(appointmentData);

        if (session) {
          const fullSessionData = await sessionApi.getById(session.id);
          setSession(fullSessionData);
        }
      } catch (err) {
        console.error("Failed to reload data:", err);
      }
    }
  };

  const handleSessionEnd = async () => {
    // Reload appointment data after session ends
    if (id) {
      try {
        const appointmentData = await appointmentApi.getById(id);
        setAppointment(appointmentData);

        // Reload session to show completed state
        if (session) {
          const fullSessionData = await sessionApi.getById(session.id);
          setSession(fullSessionData);
        }
      } catch (err) {
        console.error("Failed to reload data:", err);
      }
    }
  };

  if (loading) return <div className="text-center p-8">Loading...</div>;
  if (error || !appointment) return <div className="text-red-600 p-8">{error}</div>;

  const formatDateTime = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleString("en-US", {
      dateStyle: "long",
      timeStyle: "short"
    });
  };

  const duration = Math.round((new Date(appointment.end_time).getTime() - new Date(appointment.start_time).getTime()) / 60000);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Link href="/appointments" className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg">
            <ArrowLeft className="w-5 h-5" />
          </Link>
          <div>
            <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Appointment Details</h1>
          </div>
        </div>
        <div className="flex gap-3">
          {appointment.status === "confirmed" && !session && (
            <button
              onClick={handleStartSession}
              disabled={startingSession}
              className="flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <PlayCircle className="w-4 h-4" />
              {startingSession ? "Starting..." : "Start Session"}
            </button>
          )}
          {appointment.status !== "cancelled" && appointment.status !== "completed" && (
            <>
              <Link href={`/appointments/${id}/edit`} className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700">
                <Edit className="w-4 h-4" />
                Edit
              </Link>
              <button onClick={handleCancel} className="flex items-center gap-2 px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700">
                <XCircle className="w-4 h-4" />
                Cancel
              </button>
            </>
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 bg-white dark:bg-gray-800 rounded-lg shadow border p-6">
          <h2 className="text-lg font-semibold mb-4">Appointment Information</h2>
          <div className="space-y-4">
            <div className="flex items-center gap-3">
              <User className="w-5 h-5 text-gray-400" />
              <div>
                <p className="text-sm text-gray-600 dark:text-gray-400">Client</p>
                <p className="font-medium">{client?.full_name || "Loading..."}</p>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <Calendar className="w-5 h-5 text-gray-400" />
              <div>
                <p className="text-sm text-gray-600 dark:text-gray-400">Start Time</p>
                <p className="font-medium">{formatDateTime(appointment.start_time)}</p>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <Clock className="w-5 h-5 text-gray-400" />
              <div>
                <p className="text-sm text-gray-600 dark:text-gray-400">Duration</p>
                <p className="font-medium">{duration} minutes</p>
              </div>
            </div>
            <div>
              <p className="text-sm text-gray-600 dark:text-gray-400 mb-1">Type</p>
              <p className="font-medium">
                {appointment.appointment_type === 'in_person' ? 'In-Person' : 'Online'}
              </p>
            </div>
            <div>
              <p className="text-sm text-gray-600 dark:text-gray-400 mb-1">Status</p>
              <span className={`px-2 py-1 text-xs font-medium rounded-full ${appointment.status === 'confirmed' ? 'bg-green-100 text-green-800' : 'bg-blue-100 text-blue-800'}`}>
                {appointment.status.charAt(0).toUpperCase() + appointment.status.slice(1)}
              </span>
            </div>
          </div>
          {appointment.notes && (
            <div className="mt-6">
              <div className="flex items-center gap-2 mb-2">
                <FileText className="w-5 h-5" />
                <h3 className="font-semibold">Notes</h3>
              </div>
              <p className="text-gray-700 dark:text-gray-300 whitespace-pre-wrap">{appointment.notes}</p>
            </div>
          )}
        </div>

        <div className="bg-white dark:bg-gray-800 rounded-lg shadow border p-6">
          <h2 className="text-lg font-semibold mb-4">Metadata</h2>
          <div className="space-y-3 text-sm">
            <div>
              <p className="text-gray-600 dark:text-gray-400 mb-1">Appointment ID</p>
              <p className="font-mono text-xs bg-gray-50 dark:bg-gray-900 p-2 rounded">{appointment.id}</p>
            </div>
            <div>
              <p className="text-gray-600 dark:text-gray-400 mb-1">Created</p>
              <p>{new Date(appointment.created_at).toLocaleDateString()}</p>
            </div>
          </div>
        </div>
      </div>

      {/* Session Details - Show if session exists */}
      {session && (
        <div className="mt-8">
          <SessionDetails
            session={session}
            onSessionUpdate={handleSessionUpdate}
            onSessionEnd={handleSessionEnd}
            showAppointmentInfo={false}
          />
        </div>
      )}
    </div>
  );
}
