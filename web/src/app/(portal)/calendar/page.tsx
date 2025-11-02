"use client";

import { ChevronLeft, ChevronRight, Plus } from "lucide-react";
import { useEffect, useState } from "react";
import { appointmentApi, type AppointmentWithClient } from "@/lib/api/appointment-api";
import Link from "next/link";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button";
import { useRouter } from "next/navigation"

/**
 * Calendar page
 * Displays calendar view of appointments
 */
export default function CalendarPage() {
  const router = useRouter();
  const [currentDate, setCurrentDate] = useState(new Date());
  const [appointments, setAppointments] = useState<AppointmentWithClient[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [view, setView] = useState<"month" | "week" | "day">("month");

  // Fetch appointments for the current month
  useEffect(() => {
    const fetchAppointments = async () => {
      try {
        setLoading(true);
        setError(null);

        // Get first and last day of current month
        const firstDay = new Date(currentDate.getFullYear(), currentDate.getMonth(), 1);
        const lastDay = new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 0, 23, 59, 59);

        const data = await appointmentApi.getAll({
          include_client: true,
          start_date: firstDay.toISOString(),
          end_date: lastDay.toISOString(),
        }) as AppointmentWithClient[];

        setAppointments(data);
      } catch (err) {
        console.error("Error fetching appointments:", err);
        setError(err instanceof Error ? err.message : "Failed to load appointments");
      } finally {
        setLoading(false);
      }
    };

    fetchAppointments();
  }, [currentDate]);

  // Navigate to previous month
  const previousMonth = () => {
    setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() - 1));
  };

  // Navigate to next month
  const nextMonth = () => {
    setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() + 1));
  };

  // Navigate to today
  const goToToday = () => {
    setCurrentDate(new Date());
  };

  // Get month name and year
  const monthYear = currentDate.toLocaleDateString("en-US", {
    month: "long",
    year: "numeric",
  });

  // Generate calendar days
  const generateCalendarDays = () => {
    const year = currentDate.getFullYear();
    const month = currentDate.getMonth();

    // First day of month
    const firstDay = new Date(year, month, 1);
    const firstDayOfWeek = firstDay.getDay(); // 0 = Sunday

    // Last day of month
    const lastDay = new Date(year, month + 1, 0);
    const daysInMonth = lastDay.getDate();

    // Previous month's trailing days
    const prevMonthLastDay = new Date(year, month, 0);
    const prevMonthDays = prevMonthLastDay.getDate();

    const days: Array<{
      date: Date;
      isCurrentMonth: boolean;
      isToday: boolean;
    }> = [];

    // Add previous month's trailing days
    for (let i = firstDayOfWeek - 1; i >= 0; i--) {
      const date = new Date(year, month - 1, prevMonthDays - i);
      days.push({
        date,
        isCurrentMonth: false,
        isToday: false,
      });
    }

    // Add current month's days
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    for (let day = 1; day <= daysInMonth; day++) {
      const date = new Date(year, month, day);
      const dateOnly = new Date(date);
      dateOnly.setHours(0, 0, 0, 0);

      days.push({
        date,
        isCurrentMonth: true,
        isToday: dateOnly.getTime() === today.getTime(),
      });
    }

    // Add next month's leading days to complete the grid (42 cells = 6 rows)
    const remainingCells = 42 - days.length;
    for (let day = 1; day <= remainingCells; day++) {
      const date = new Date(year, month + 1, day);
      days.push({
        date,
        isCurrentMonth: false,
        isToday: false,
      });
    }

    return days;
  };

  // Get appointments for a specific day
  const getAppointmentsForDay = (date: Date) => {
    const dateOnly = new Date(date);
    dateOnly.setHours(0, 0, 0, 0);

    return appointments.filter((appointment) => {
      const appointmentDate = new Date(appointment.start_time);
      appointmentDate.setHours(0, 0, 0, 0);
      return appointmentDate.getTime() === dateOnly.getTime();
    });
  };

  // Format time for appointment display
  const formatTime = (dateString: string) => {
    return new Date(dateString).toLocaleTimeString("en-US", {
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  // Get status color
  const getStatusColor = (status: string) => {
    switch (status) {
      case "confirmed":
        return "bg-green-100 dark:bg-green-900/30 text-green-800 dark:text-green-400 border-green-300 dark:border-green-700";
      case "scheduled":
        return "bg-blue-100 dark:bg-blue-900/30 text-blue-800 dark:text-blue-400 border-blue-300 dark:border-blue-700";
      case "completed":
        return "bg-gray-100 dark:bg-gray-900/30 text-gray-800 dark:text-gray-400 border-gray-300 dark:border-gray-700";
      case "cancelled":
        return "bg-red-100 dark:bg-red-900/30 text-red-800 dark:text-red-400 border-red-300 dark:border-red-700";
      case "no_show":
        return "bg-orange-100 dark:bg-orange-900/30 text-orange-800 dark:text-orange-400 border-orange-300 dark:border-orange-700";
      default:
        return "bg-gray-100 dark:bg-gray-900/30 text-gray-800 dark:text-gray-400 border-gray-300 dark:border-gray-700";
    }
  };

  const calendarDays = generateCalendarDays();

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
            Calendar
          </h1>
          <p className="mt-2 text-gray-600 dark:text-gray-400">
            View your appointments in calendar format
          </p>
        </div>
        <Button size="sm" variant="default" onClick={() => router.push("/appointments/new")}>
          <Plus className="w-4 h-4 mr-2" />
          New Appointment
        </Button>
      </div>

      {/* Calendar Controls */}
      <Card>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <button
              onClick={previousMonth}
              className="p-2 border border-gray-300 dark:border-gray-600 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
              title="Previous month"
            >
              <ChevronLeft className="w-5 h-5 text-gray-600 dark:text-gray-400" />
            </button>
            <button
              onClick={nextMonth}
              className="p-2 border border-gray-300 dark:border-gray-600 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
              title="Next month"
            >
              <ChevronRight className="w-5 h-5 text-gray-600 dark:text-gray-400" />
            </button>
            <div className="px-4 py-2 font-semibold text-lg text-gray-900 dark:text-white">
              {monthYear}
            </div>
            <Button variant="outline" size="sm" onClick={goToToday}>
              Today
            </Button>
          </div>

          {/* View Toggle (placeholder for future week/day views) */}
          <div className="flex items-center gap-2">
            <Button variant="link" size="sm" onClick={() => setView("month")}>
              Month
            </Button>
          </div>
        </div>
      </Card>

      {/* Error State */}
      {error && (
        <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-4">
          <p className="text-red-800 dark:text-red-400">{error}</p>
        </div>
      )}

      {/* Calendar Grid */}
      <Card className="p-0">
        <CardContent>
          {/* Weekday Headers */}
          <div className="grid grid-cols-7 border-b border-gray-200 dark:border-gray-700">
            {["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"].map((day) => (
              <div
                key={day}
                className={cn("px-2 py-3 text-center text-sm font-semibold text-gray-700 dark:text-gray-300 bg-gray-50 dark:bg-gray-900", day === "Mon" ? "rounded-tl-xl" : "", day === "Sun" ? "rounded-tr-xl" : "")}
              >
                {day}
              </div>
            ))}
          </div>

          {/* Calendar Days */}
          {loading ? (
            <div className="p-12 text-center">
              <p className="text-gray-600 dark:text-gray-400">Loading calendar...</p>
            </div>
          ) : (
            <div className="grid grid-cols-7">
              {calendarDays.map((day, index) => {
                const dayAppointments = getAppointmentsForDay(day.date);

                return (
                  <div
                    key={index}
                    className={`min-h-[120px] border-r border-b border-gray-200 dark:border-gray-700 p-2 ${!day.isCurrentMonth
                      ? "bg-gray-50 dark:bg-gray-900/50"
                      : "bg-white dark:bg-gray-800"
                      } ${index % 7 === 6 ? "border-r-0" : ""}
                       ${index === calendarDays.length - 7 ? "rounded-bl-lg" : ""}
                       ${index === calendarDays.length - 1 ? "rounded-br-lg" : ""}`}
                  >
                    {/* Day Number */}
                    <div className="flex items-center justify-between mb-1">
                      <span
                        className={`inline-flex items-center justify-center w-7 h-7 rounded-full text-sm font-medium ${day.isToday
                          ? "bg-blue-600 text-white"
                          : day.isCurrentMonth
                            ? "text-gray-900 dark:text-white"
                            : "text-gray-400 dark:text-gray-600"
                          }`}
                      >
                        {day.date.getDate()}
                      </span>
                    </div>

                    {/* Appointments */}
                    <div className="space-y-1">
                      {dayAppointments.slice(0, 3).map((appointment) => (
                        <Link
                          key={appointment.id}
                          href={`/appointments/${appointment.id}`}
                          className={`block px-2 py-1 rounded text-xs border transition-colors hover:shadow-sm ${getStatusColor(
                            appointment.status
                          )}`}
                          title={`${formatTime(appointment.start_time)} - ${appointment.client.first_name} ${appointment.client.last_name}`}
                        >
                          <div className="font-medium truncate">
                            {formatTime(appointment.start_time)}
                          </div>
                          <div className="truncate">
                            {appointment.client.first_name} {appointment.client.last_name}
                          </div>
                        </Link>
                      ))}
                      {dayAppointments.length > 3 && (
                        <div className="px-2 py-1 text-xs text-gray-600 dark:text-gray-400 font-medium">
                          +{dayAppointments.length - 3} more
                        </div>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </CardContent>
      </Card>


      {/* Legend */}
      <Card>
        <CardHeader><CardTitle>Status Legend</CardTitle></CardHeader>
        <CardContent> <div className="flex flex-wrap gap-4">
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 rounded bg-blue-600"></div>
            <span className="text-sm text-gray-600 dark:text-gray-400">Scheduled</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 rounded bg-green-600"></div>
            <span className="text-sm text-gray-600 dark:text-gray-400">Confirmed</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 rounded bg-gray-600"></div>
            <span className="text-sm text-gray-600 dark:text-gray-400">Completed</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 rounded bg-red-600"></div>
            <span className="text-sm text-gray-600 dark:text-gray-400">Cancelled</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 rounded bg-orange-600"></div>
            <span className="text-sm text-gray-600 dark:text-gray-400">No Show</span>
          </div>
        </div></CardContent>
      </Card>
    </div>
  );
}
