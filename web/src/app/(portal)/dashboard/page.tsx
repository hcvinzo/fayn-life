"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { dashboardApi } from "@/lib/api/dashboard-api"
import { sessionApi } from "@/lib/api/session-api"
import type { DashboardData } from "@/types/dashboard"
import { format, isSameDay } from "date-fns"
import Link from "next/link"
import {
  CalendarIcon,
  UserPlusIcon,
  PlusIcon,
  ClockIcon,
  UsersIcon,
  TrendingUpIcon,
  CheckCircle2Icon,
  PlayCircle,
  Calendar,
  CalendarOff,
  Loader2
} from "lucide-react"
import { StatsCard } from "@/components/ui/stats-card"
import { Card, CardAction, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { ExceptionDialog } from "@/components/portal/exception-dialog"

/**
 * Dashboard page
 * Displays practice statistics, today's appointments, and upcoming appointments
 */
export default function DashboardPage() {
  const router = useRouter()
  const [data, setData] = useState<DashboardData | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [startingSessions, setStartingSessions] = useState<Set<string>>(new Set())
  const [isNavigatingToNewAppointment, setIsNavigatingToNewAppointment] = useState(false)
  const [isNavigatingToCalendar, setIsNavigatingToCalendar] = useState(false)

  useEffect(() => {
    loadDashboardData()
  }, [])

  async function loadDashboardData() {
    try {
      setLoading(true)
      setError(null)
      const dashboardData = await dashboardApi.getDashboardData()
      setData(dashboardData)
    } catch (err) {
      console.error("Failed to load dashboard:", err)
      setError("Failed to load dashboard data")
    } finally {
      setLoading(false)
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-gray-600 dark:text-gray-400">Loading dashboard...</div>
      </div>
    )
  }

  if (error || !data) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-red-600 dark:text-red-400">{error || "Failed to load data"}</div>
      </div>
    )
  }

  const { stats, todayAppointments, upcomingAppointments } = data

  // Format appointment time
  const formatTime = (dateTime: string) => {
    return format(new Date(dateTime), "h:mm a")
  }

  // Start session handler - redirect to appointment page where session will be displayed
  async function handleStartSession(appointment: any) {
    try {
      setStartingSessions(prev => new Set(prev).add(appointment.id))
      const session = await sessionApi.create({
        practice_id: appointment.practice_id,
        appointment_id: appointment.id,
        client_id: appointment.client_id,
        practitioner_id: appointment.practitioner_id,
      })
      // Redirect to appointment page instead of session page
      router.push(`/appointments/${appointment.id}`)
    } catch (err) {
      console.error("Failed to start session:", err)
      alert("Failed to start session. Make sure the appointment is confirmed.")
      setStartingSessions(prev => {
        const next = new Set(prev)
        next.delete(appointment.id)
        return next
      })
    }
  }

  // Handle new appointment navigation
  function handleNewAppointment() {
    setIsNavigatingToNewAppointment(true)
    router.push("/appointments/new")
  }

  // Handle calendar navigation
  function handleViewCalendar() {
    setIsNavigatingToCalendar(true)
    router.push("/calendar")
  }

  // Get status color
  const getStatusColor = (status: string) => {
    switch (status) {
      case "completed":
        return "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200"
      case "confirmed":
        return "bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200"
      case "scheduled":
        return "bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200"
      case "cancelled":
        return "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200"
      case "no_show":
        return "bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-200"
      default:
        return "bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-200"
    }
  }

  return (
    <div className="space-y-8">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
          Dashboard
        </h1>
        <p className="mt-2 text-gray-600 dark:text-gray-400">
          Welcome back! Here&apos;s what&apos;s happening today.
        </p>
      </div>

      {/* Key Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {/* Today Fill Rate */}
        <StatsCard
          title="Today Fill Rate"
          value={stats.todayFillRate.toString() + "%"}
          icon={TrendingUpIcon}
          trend={`${stats.todayAppointments} appointments`}
        />

        {/* Week Fill Rate */}
        <StatsCard
          title="Week Fill Rate"
          value={stats.weekFillRate.toString() + "%"}
          icon={CheckCircle2Icon}
          trend={`${stats.weekAppointments} appointments`}
        />

        {/* Total Clients */}
        <StatsCard
          title="Total Clients"
          value={stats.totalClients.toString()}
          icon={UsersIcon}
          trend="Active Clients"
        />

        {/* Quick Action - New Appointment */}
        <button
          onClick={handleNewAppointment}
          disabled={isNavigatingToNewAppointment}
          className="bg-gradient-to-br rounded-lg shadow p-6 border border-blue-400 transition-all hover:shadow-lg text-white group disabled:opacity-70 disabled:cursor-not-allowed text-left"
        >
          <div className="flex items-center justify-between">
            <div className="text-sm font-medium">Quick Action</div>
            {isNavigatingToNewAppointment ? (
              <Loader2 className="h-5 w-5 animate-spin" />
            ) : (
              <PlusIcon className="h-5 w-5 group-hover:scale-110 transition-transform" />
            )}
          </div>
          <div className="mt-2">
            <div className="text-2xl font-bold">
              {isNavigatingToNewAppointment ? "Loading..." : "New Appointment"}
            </div>
            <div className="text-sm text-blue-100 mt-1">
              {isNavigatingToNewAppointment ? "Please wait..." : "Schedule now"}
            </div>
          </div>
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">

        {/* Today's Appointments */}
        <Card className="lg:col-span-2">
          <CardHeader className="border-b py-2">
            <CardTitle>
              <ClockIcon className="h-5 w-5 text-gray-600 dark:text-gray-400" />
              Today's Appointments
            </CardTitle>
            <CardAction>
              <Button
                variant="ghost"
                size="sm"
                className="hidden md:flex"
                onClick={handleNewAppointment}
                disabled={isNavigatingToNewAppointment}
              >
                {isNavigatingToNewAppointment ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-1 animate-spin" />
                    Loading...
                  </>
                ) : (
                  "+ New"
                )}
              </Button>
            </CardAction>
          </CardHeader>
          <CardContent>
            {todayAppointments.length === 0 ? (
              <div className="text-center">
                <p className="text-gray-600 dark:text-gray-400 py-8">
                  No appointments scheduled for today.
                </p>
                <Button
                  variant="outline"
                  onClick={handleNewAppointment}
                  disabled={isNavigatingToNewAppointment}
                >
                  {isNavigatingToNewAppointment ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Loading...
                    </>
                  ) : (
                    <>
                      <Calendar className="mr-2 h-4 w-4" />
                      Schedule Appointment
                    </>
                  )}
                </Button>
              </div>
            ) : (
              <div className="space-y-3">
                {todayAppointments.map((appointment) => (
                  <div
                    key={appointment.id}
                    className="p-4 rounded-lg border border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors"
                  >
                    <div className="flex items-center justify-between">
                      <Link href={`/appointments/${appointment.id}`} className="flex-1">
                        <div className="flex items-center gap-3">
                          <span className="text-sm font-medium text-gray-900 dark:text-white">
                            {formatTime(appointment.start_time)} - {formatTime(appointment.end_time)}
                          </span>
                          <span
                            className={`text-xs px-2 py-1 rounded-full ${getStatusColor(
                              appointment.status
                            )}`}
                          >
                            {appointment.status}
                          </span>
                        </div>
                        <div className="mt-1 text-sm text-gray-600 dark:text-gray-400">
                          {appointment.client.first_name} {appointment.client.last_name}
                        </div>
                        {appointment.notes && (
                          <div className="mt-1 text-xs text-gray-500 dark:text-gray-500 truncate">
                            {appointment.notes}
                          </div>
                        )}
                      </Link>
                      <div className="ml-4 flex items-center gap-2">
                        <span
                          className={`text-xs px-2 py-1 rounded ${appointment.appointment_type === "in_person"
                            ? "bg-blue-100 text-blue-700 dark:bg-blue-900 dark:text-blue-300"
                            : "bg-purple-100 text-purple-700 dark:bg-purple-900 dark:text-purple-300"
                            }`}
                        >
                          {appointment.appointment_type === "in_person" ? "In-Person" : "Online"}
                        </span>
                        {appointment.status === "confirmed" && (
                          <Button
                            variant="default"
                            size="sm"
                            onClick={(e) => {
                              e.preventDefault()
                              handleStartSession(appointment)
                            }}
                            disabled={startingSessions.has(appointment.id)}
                            className="bg-green-600 hover:bg-green-700 text-white text-xs h-7"
                            title="Start session"
                          >
                            {startingSessions.has(appointment.id) ? (
                              <>
                                <Loader2 className="h-3 w-3 mr-1 animate-spin" />
                                Starting...
                              </>
                            ) : (
                              <>
                                <PlayCircle className="h-3 w-3 mr-1" />
                                Start
                              </>
                            )}
                          </Button>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        <div className="space-y-4">

          {/* Upcoming Appointments Calendar */}
          <Card>
            <CardHeader className="border-b py-2">
              <CardTitle>
                <CalendarIcon className="h-5 w-5 text-gray-600 dark:text-gray-400" />
                Upcoming
              </CardTitle>
              <CardAction>
                <Button
                  variant="ghost"
                  size="sm"
                  className="hidden md:flex"
                  onClick={handleViewCalendar}
                  disabled={isNavigatingToCalendar}
                >
                  {isNavigatingToCalendar ? (
                    <>
                      <Loader2 className="w-4 h-4 mr-1 animate-spin" />
                      Loading...
                    </>
                  ) : (
                    "View Calendar"
                  )}
                </Button>
              </CardAction>
            </CardHeader>
            <CardContent className="text-3xl font-bold text-gray-900 dark:text-white">
              {upcomingAppointments.length === 0 ? (
                <p className="text-gray-600 dark:text-gray-400 text-center py-8 text-sm">
                  No upcoming appointments in the next 7 days.
                </p>
              ) : (
                <div className="space-y-3">
                  {upcomingAppointments.map((appointment) => (
                    <Link
                      key={appointment.id}
                      href={`/appointments/${appointment.id}`}
                      className="block p-3 rounded-lg border border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors"
                    >
                      <div className="text-xs font-medium text-gray-500 dark:text-gray-400 mb-1">
                        {format(new Date(appointment.start_time), "EEE, MMM d")}
                      </div>
                      <div className="text-sm font-medium text-gray-900 dark:text-white">
                        {formatTime(appointment.start_time)}
                      </div>
                      <div className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                        {appointment.client.first_name} {appointment.client.last_name}
                      </div>
                      <div className="mt-2">
                        <span
                          className={`text-xs px-2 py-1 rounded-full ${getStatusColor(
                            appointment.status
                          )}`}
                        >
                          {appointment.status}
                        </span>
                      </div>
                    </Link>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>

          {/* Quick Actions */}
          <Card>
            <CardHeader className="border-b py-2">
              <CardTitle>
                Quick Actions
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <Button
                variant="outline"
                className="w-full justify-start"
                onClick={handleNewAppointment}
                disabled={isNavigatingToNewAppointment}
              >
                {isNavigatingToNewAppointment ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Loading...
                  </>
                ) : (
                  <>
                    <Calendar className="mr-2 h-4 w-4" />
                    New Appointment
                  </>
                )}
              </Button>

              <ExceptionDialog
                onSuccess={() => {
                  // Optionally reload dashboard data or show success message
                  loadDashboardData()
                }}
                trigger={
                  <Button
                    variant="outline"
                    className="w-full justify-start"
                  >
                    <CalendarOff className="mr-2 h-4 w-4" />Set Time Off Period
                  </Button>
                }
              />
            </CardContent>
          </Card>

        </div>

      </div>

    </div >
  )
}
