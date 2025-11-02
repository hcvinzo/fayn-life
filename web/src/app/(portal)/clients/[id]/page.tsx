"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { clientApi, type Client } from "@/lib/api/client-api";
import { appointmentApi, type AppointmentWithClient } from "@/lib/api/appointment-api";
import { sessionApi } from "@/lib/api/session-api";
import { ArrowLeft, Edit, Archive, Mail, Phone, Calendar, FileText, PlayCircle, Plus } from "lucide-react";
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
  const [appointments, setAppointments] = useState<AppointmentWithClient[]>([]);
  const [loadingAppointments, setLoadingAppointments] = useState(true);
  const [startingSession, setStartingSession] = useState(false);

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

  // Fetch appointments for this client
  useEffect(() => {
    const fetchAppointments = async () => {
      try {
        setLoadingAppointments(true);
        const data = await appointmentApi.getAll({
          client_id: id,
          include_client: false, // We already have client data
        });
        setAppointments(data as AppointmentWithClient[]);
      } catch (err) {
        console.error("Error fetching appointments:", err);
      } finally {
        setLoadingAppointments(false);
      }
    };

    if (id) {
      fetchAppointments();
    }
  }, [id]);

  // Split appointments into upcoming and past
  const now = new Date();
  const upcomingAppointments = appointments
    .filter((apt) =>
      new Date(apt.start_time) > now &&
      apt.status !== "completed" &&
      apt.status !== "cancelled"
    )
    .sort((a, b) => new Date(a.start_time).getTime() - new Date(b.start_time).getTime());

  const pastAppointments = appointments
    .filter((apt) =>
      new Date(apt.start_time) <= now ||
      apt.status === "completed" ||
      apt.status === "cancelled"
    )
    .sort((a, b) => new Date(b.start_time).getTime() - new Date(a.start_time).getTime());

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

  const handleStartSession = async (appointment: AppointmentWithClient) => {
    try {
      setStartingSession(true);
      const session = await sessionApi.create({
        practice_id: appointment.practice_id,
        appointment_id: appointment.id,
        client_id: appointment.client_id,
        practitioner_id: appointment.practitioner_id,
      });
      router.push(`/appointments/${appointment.id}`);
    } catch (err) {
      console.error("Error starting session:", err);
      alert(err instanceof Error ? err.message : "Failed to start session");
    } finally {
      setStartingSession(false);
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

  const getAppointmentStatusColor = (status: string) => {
    switch (status) {
      case "scheduled":
        return "bg-blue-100 dark:bg-blue-900/20 text-blue-800 dark:text-blue-400";
      case "confirmed":
        return "bg-green-100 dark:bg-green-900/20 text-green-800 dark:text-green-400";
      case "completed":
        return "bg-gray-100 dark:bg-gray-900/20 text-gray-800 dark:text-gray-400";
      case "cancelled":
        return "bg-red-100 dark:bg-red-900/20 text-red-800 dark:text-red-400";
      case "no_show":
        return "bg-orange-100 dark:bg-orange-900/20 text-orange-800 dark:text-orange-400";
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

          {/* Upcoming Appointments */}
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle>
                  <div className="flex items-center gap-2">
                    <Calendar className="w-5 h-5" />
                    Upcoming Appointments
                  </div>
                </CardTitle>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => router.push(`/appointments/new?client_id=${id}`)}
                >
                  <Plus className="w-4 h-4" />
                  New Appointment
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              {loadingAppointments ? (
                <p className="text-sm text-gray-600 dark:text-gray-400 text-center py-4">
                  Loading appointments...
                </p>
              ) : upcomingAppointments.length === 0 ? (
                <div className="text-center py-8">
                  <Calendar className="w-12 h-12 mx-auto text-gray-400 mb-3" />
                  <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">
                    No appointments scheduled
                  </p>
                  <Button
                    size="sm"
                    onClick={() => router.push(`/appointments/new?client_id=${id}`)}
                  >
                    <Plus className="w-4 h-4 mr-1" />
                    Schedule Appointment
                  </Button>
                </div>
              ) : (
                <div className="space-y-3">
                  {upcomingAppointments.map((appointment, index) => (
                    <div
                      key={appointment.id}
                      className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-900 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
                    >
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-1">
                          <p className="text-sm font-medium text-gray-900 dark:text-white">
                            {formatDateTime(appointment.start_time)}
                          </p>
                          <span
                            className={`px-2 py-0.5 text-xs font-medium rounded-full ${getAppointmentStatusColor(
                              appointment.status
                            )}`}
                          >
                            {appointment.status.charAt(0).toUpperCase() +
                              appointment.status.slice(1).replace('_', ' ')}
                          </span>
                        </div>
                        {appointment.notes && (
                          <p className="text-xs text-gray-600 dark:text-gray-400 line-clamp-1">
                            {appointment.notes}
                          </p>
                        )}
                      </div>
                      {index === 0 && (appointment.status === "scheduled" || appointment.status === "confirmed") && !appointment.has_session && (
                        <Button
                          variant="link"
                          size="sm"
                          onClick={() => handleStartSession(appointment)}
                          disabled={startingSession}
                          className="ml-3"
                        >
                          <PlayCircle className="w-4 h-4 mr-1" />
                        </Button>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>

          {/* Appointment History */}
          <Card>
            <CardHeader>
              <CardTitle>
                <div className="flex items-center gap-2">
                  <Calendar className="w-5 h-5" />
                  Appointment History
                </div>
              </CardTitle>
            </CardHeader>
            <CardContent>
              {loadingAppointments ? (
                <p className="text-sm text-gray-600 dark:text-gray-400 text-center py-4">
                  Loading appointments...
                </p>
              ) : pastAppointments.length === 0 ? (
                <div className="text-center py-8">
                  <Calendar className="w-12 h-12 mx-auto text-gray-400 mb-3" />
                  <p className="text-sm text-gray-600 dark:text-gray-400">
                    No appointments
                  </p>
                </div>
              ) : (
                <div className="space-y-2">
                  {pastAppointments.slice(0, 10).map((appointment) => (
                    <Link
                      key={appointment.id}
                      href={`/appointments/${appointment.id}`}
                      className="block p-3 bg-gray-50 dark:bg-gray-900 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
                    >
                      <div className="flex items-center justify-between mb-1">
                        <p className="text-sm font-medium text-gray-900 dark:text-white">
                          {formatDateTime(appointment.start_time)}
                        </p>
                        <span
                          className={`px-2 py-0.5 text-xs font-medium rounded-full ${getAppointmentStatusColor(
                            appointment.status
                          )}`}
                        >
                          {appointment.status.charAt(0).toUpperCase() +
                            appointment.status.slice(1).replace('_', ' ')}
                        </span>
                      </div>
                      {appointment.notes && (
                        <p className="text-xs text-gray-600 dark:text-gray-400 line-clamp-1">
                          {appointment.notes}
                        </p>
                      )}
                    </Link>
                  ))}
                  {pastAppointments.length > 10 && (
                    <p className="text-xs text-gray-500 dark:text-gray-500 text-center pt-2">
                      Showing 10 of {pastAppointments.length} appointments
                    </p>
                  )}
                </div>
              )}
            </CardContent>
          </Card>
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
