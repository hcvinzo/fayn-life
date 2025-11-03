"use client";

import { Plus, Filter, Eye, Edit, XCircle, PlayCircle, Loader2 } from "lucide-react";
import { useEffect, useState, useCallback } from "react";
import { appointmentApi, type AppointmentWithClient, type AppointmentFilters } from "@/lib/api/appointment-api";
import { sessionApi } from "@/lib/api/session-api";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { ColumnDef } from "@tanstack/react-table";
import { DataTable } from "@/components/ui/data-table";
import { Card, CardContent } from "@/components/ui/card";

/**
 * Appointments page
 * Displays list of all appointments with filter capabilities
 */
export default function AppointmentsPage() {
  const router = useRouter();
  const [appointments, setAppointments] = useState<AppointmentWithClient[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [statusFilter, setStatusFilter] = useState<AppointmentFilters["status"] | "all">("all");
  const [dateFilter, setDateFilter] = useState<"all" | "today" | "week" | "month">("all");
  const [startingSessions, setStartingSessions] = useState<Set<string>>(new Set());
  const [isNavigating, setIsNavigating] = useState(false);

  // Fetch appointments
  const fetchAppointments = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      const filters: AppointmentFilters = {
        include_client: true,
      };

      if (statusFilter && statusFilter !== "all") {
        filters.status = statusFilter;
      }

      // Calculate date range based on filter
      if (dateFilter !== "all") {
        const today = new Date();
        today.setHours(0, 0, 0, 0);

        filters.start_date = today.toISOString();

        if (dateFilter === "today") {
          const endOfDay = new Date(today);
          endOfDay.setHours(23, 59, 59, 999);
          filters.end_date = endOfDay.toISOString();
        } else if (dateFilter === "week") {
          const endOfWeek = new Date(today);
          endOfWeek.setDate(today.getDate() + 7);
          filters.end_date = endOfWeek.toISOString();
        } else if (dateFilter === "month") {
          const endOfMonth = new Date(today);
          endOfMonth.setMonth(today.getMonth() + 1);
          filters.end_date = endOfMonth.toISOString();
        }
      }

      const data = await appointmentApi.getAll(filters) as AppointmentWithClient[];
      setAppointments(data);
    } catch (err) {
      console.error("Error fetching appointments:", err);
      setError(err instanceof Error ? err.message : "Failed to load appointments");
    } finally {
      setLoading(false);
    }
  }, [statusFilter, dateFilter]);

  // Fetch appointments on mount and when filters change
  useEffect(() => {
    fetchAppointments();
  }, [fetchAppointments]);

  // Cancel appointment handler
  const handleCancel = async (id: string, clientName: string) => {
    if (!confirm(`Are you sure you want to cancel the appointment with ${clientName}?`)) {
      return;
    }

    try {
      await appointmentApi.cancel(id);
      fetchAppointments(); // Refresh list
    } catch (err) {
      console.error("Error cancelling appointment:", err);
      alert("Failed to cancel appointment");
    }
  };

  // Start session handler - redirect to appointment page where session will be created
  const handleStartSession = async (appointment: AppointmentWithClient) => {
    try {
      setStartingSessions(prev => new Set(prev).add(appointment.id));
      const session = await sessionApi.create({
        practice_id: appointment.practice_id,
        appointment_id: appointment.id,
        client_id: appointment.client_id,
        practitioner_id: appointment.practitioner_id,
      });
      // Redirect to appointment page instead of session page
      router.push(`/appointments/${appointment.id}`);
    } catch (err) {
      console.error("Failed to start session:", err);
      alert("Failed to start session. Make sure the appointment is confirmed.");
      setStartingSessions(prev => {
        const next = new Set(prev);
        next.delete(appointment.id);
        return next;
      });
    }
  };

  // Handle new appointment navigation
  const handleNewAppointment = () => {
    setIsNavigating(true);
    router.push("/appointments/new");
  };

  // Status badge color helper
  const getStatusColor = (status: string) => {
    switch (status) {
      case "confirmed":
        return "bg-green-100 dark:bg-green-900/20 text-green-800 dark:text-green-400";
      case "scheduled":
        return "bg-blue-100 dark:bg-blue-900/20 text-blue-800 dark:text-blue-400";
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

  // Format date and time
  const formatDateTime = (dateString: string) => {
    const date = new Date(dateString);
    return {
      date: date.toLocaleDateString("en-US", {
        year: "numeric",
        month: "short",
        day: "numeric",
      }),
      time: date.toLocaleTimeString("en-US", {
        hour: "2-digit",
        minute: "2-digit",
      }),
    };
  };

  // Calculate duration
  const calculateDuration = (startTime: string, endTime: string) => {
    const start = new Date(startTime);
    const end = new Date(endTime);
    const durationMinutes = Math.round((end.getTime() - start.getTime()) / (1000 * 60));
    return `${durationMinutes} min`;
  };

  // Column definitions for DataTable
  const columns: ColumnDef<AppointmentWithClient>[] = [
    {
      accessorKey: "client",
      header: "Client",
      cell: ({ row }) => (
        <div className="text-sm font-medium text-gray-900 dark:text-white">
          {`${row.original.client.first_name} ${row.original.client.last_name}`}
        </div>
      ),
    },
    {
      accessorKey: "start_time",
      header: "Date",
      cell: ({ row }) => {
        const { date } = formatDateTime(row.getValue("start_time"));
        return <div className="text-sm text-gray-600 dark:text-gray-400">{date}</div>;
      },
    },
    {
      id: "time",
      header: "Time",
      cell: ({ row }) => {
        const { time } = formatDateTime(row.original.start_time);
        return <div className="text-sm text-gray-600 dark:text-gray-400">{time}</div>;
      },
    },
    {
      id: "duration",
      header: "Duration",
      cell: ({ row }) => {
        const duration = calculateDuration(row.original.start_time, row.original.end_time);
        return <div className="text-sm text-gray-600 dark:text-gray-400">{duration}</div>;
      },
    },
    {
      accessorKey: "appointment_type",
      header: "Type",
      cell: ({ row }) => (
        <span className="text-sm text-gray-600 dark:text-gray-400">
          {row.getValue("appointment_type") === 'in_person' ? 'In-Person' : 'Online'}
        </span>
      ),
    },
    {
      accessorKey: "status",
      header: "Status",
      cell: ({ row }) => {
        const status = row.getValue("status") as string;
        return (
          <span
            className={`px-2 py-1 text-xs font-medium rounded-full ${getStatusColor(status)}`}
          >
            {status.charAt(0).toUpperCase() + status.slice(1).replace('_', ' ')}
          </span>
        );
      },
    },
    {
      id: "actions",
      header: () => <div className="text-right">Actions</div>,
      cell: ({ row }) => {
        const appointment = row.original;
        return (
          <div className="flex items-center justify-end gap-3">
            <Link
              href={`/appointments/${appointment.id}`}
              className="text-blue-600 dark:text-blue-400 hover:text-blue-800 dark:hover:text-blue-300"
              title="View appointment"
            >
              <Eye className="w-4 h-4" />
            </Link>
            {appointment.status === "confirmed" && !appointment.has_session && (
              <Button
                variant="ghost"
                size="sm"
                onClick={() => handleStartSession(appointment)}
                disabled={startingSessions.has(appointment.id)}
                className="text-green-600 dark:text-green-400 hover:text-green-800 dark:hover:text-green-300 h-8 w-8 p-0"
                title="Start session"
              >
                {startingSessions.has(appointment.id) ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  <PlayCircle className="w-4 h-4" />
                )}
              </Button>
            )}
            {appointment.status !== "cancelled" && appointment.status !== "completed" && (
              <>
                <Link
                  href={`/appointments/${appointment.id}/edit`}
                  className="text-purple-600 dark:text-purple-400 hover:text-purple-800 dark:hover:text-purple-300"
                  title="Edit appointment"
                >
                  <Edit className="w-4 h-4" />
                </Link>
                <button
                  onClick={() =>
                    handleCancel(appointment.id, `${appointment.client.first_name} ${appointment.client.last_name}`)
                  }
                  className="text-red-600 dark:text-red-400 hover:text-red-800 dark:hover:text-red-300"
                  title="Cancel appointment"
                >
                  <XCircle className="w-4 h-4" />
                </button>
              </>
            )}
          </div>
        );
      },
    },
  ];

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
            Appointments
          </h1>
          <p className="mt-2 text-gray-600 dark:text-gray-400">
            Manage your appointment schedule
          </p>
        </div>
        <Button
          onClick={handleNewAppointment}
          disabled={isNavigating}
        >
          {isNavigating ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Loading...
            </>
          ) : (
            <>
              <Plus className="mr-2 h-4 w-4" />
              New Appointment
            </>
          )}
        </Button>
      </div>

      {/* Filters */}
      <Card>
        <CardContent>   <div className="flex items-center gap-4">
          <Filter className="w-5 h-5 text-gray-400" />
          <Select
            value={statusFilter}
            onValueChange={(value) => setStatusFilter(value as any)}
          >
            <SelectTrigger className="w-[180px]">
              <SelectValue placeholder="All Status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Status</SelectItem>
              <SelectItem value="scheduled">Scheduled</SelectItem>
              <SelectItem value="confirmed">Confirmed</SelectItem>
              <SelectItem value="completed">Completed</SelectItem>
              <SelectItem value="cancelled">Cancelled</SelectItem>
              <SelectItem value="no_show">No Show</SelectItem>
            </SelectContent>
          </Select>
          <Select
            value={dateFilter}
            onValueChange={(value) => setDateFilter(value as any)}
          >
            <SelectTrigger className="w-[180px]">
              <SelectValue placeholder="All Dates" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Dates</SelectItem>
              <SelectItem value="today">Today</SelectItem>
              <SelectItem value="week">This Week</SelectItem>
              <SelectItem value="month">This Month</SelectItem>
            </SelectContent>
          </Select>
        </div></CardContent>
      </Card>

      {/* Loading State */}
      {loading && (
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow border border-gray-200 dark:border-gray-700 p-8 text-center">
          <p className="text-gray-600 dark:text-gray-400">Loading appointments...</p>
        </div>
      )}

      {/* Error State */}
      {error && (
        <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-4">
          <p className="text-red-800 dark:text-red-400">{error}</p>
        </div>
      )}

      {/* Empty State */}
      {!loading && !error && appointments.length === 0 && (
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow border border-gray-200 dark:border-gray-700 p-8 text-center">
          <p className="text-gray-600 dark:text-gray-400">
            {statusFilter !== "all" || dateFilter !== "all"
              ? "No appointments found matching your filters"
              : "No appointments yet. Schedule your first appointment to get started."}
          </p>
        </div>
      )}

      {/* Appointments List */}
      {!loading && !error && appointments.length > 0 && (
        <DataTable columns={columns} data={appointments} />
      )}
    </div>
  );
}
