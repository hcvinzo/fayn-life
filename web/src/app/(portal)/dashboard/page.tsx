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
  PlayCircle
} from "lucide-react"

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
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6 border border-gray-200 dark:border-gray-700">
          <div className="flex items-center justify-between">
            <div className="text-sm font-medium text-gray-600 dark:text-gray-400">
              Today Fill Rate
            </div>
            <TrendingUpIcon className="h-5 w-5 text-blue-500" />
          </div>
          <div className="mt-2 flex items-baseline gap-2">
            <div className="text-3xl font-bold text-gray-900 dark:text-white">
              {stats.todayFillRate}%
            </div>
            <div className="text-sm text-gray-600 dark:text-gray-400">
              {stats.todayAppointments} appointments
            </div>
          </div>
        </div>

        {/* Week Fill Rate */}
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6 border border-gray-200 dark:border-gray-700">
          <div className="flex items-center justify-between">
            <div className="text-sm font-medium text-gray-600 dark:text-gray-400">
              Week Fill Rate
            </div>
            <CheckCircle2Icon className="h-5 w-5 text-green-500" />
          </div>
          <div className="mt-2 flex items-baseline gap-2">
            <div className="text-3xl font-bold text-gray-900 dark:text-white">
              {stats.weekFillRate}%
            </div>
            <div className="text-sm text-gray-600 dark:text-gray-400">
              {stats.weekAppointments} appointments
            </div>
          </div>
        </div>

        {/* Total Clients */}
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6 border border-gray-200 dark:border-gray-700">
          <div className="flex items-center justify-between">
            <div className="text-sm font-medium text-gray-600 dark:text-gray-400">
              Total Clients
            </div>
            <UsersIcon className="h-5 w-5 text-purple-500" />
          </div>
          <div className="mt-2">
            <div className="text-3xl font-bold text-gray-900 dark:text-white">
              {stats.totalClients}
            </div>
            <div className="text-sm text-gray-600 dark:text-gray-400 mt-1">
              Active clients
            </div>
          </div>
        </div>

        {/* Quick Action - New Appointment */}
        <Link
          href="/appointments/new"
          className="bg-gradient-to-br from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700 rounded-lg shadow p-6 border border-blue-400 transition-all hover:shadow-lg text-white group"
        >
          <div className="flex items-center justify-between">
            <div className="text-sm font-medium">Quick Action</div>
            <PlusIcon className="h-5 w-5 group-hover:scale-110 transition-transform" />
          </div>
          <div className="mt-2">
            <div className="text-2xl font-bold">New Appointment</div>
            <div className="text-sm text-blue-100 mt-1">Schedule now</div>
          </div>
        </Link>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Today's Appointments */}
        <div className="lg:col-span-2 bg-white dark:bg-gray-800 rounded-lg shadow border border-gray-200 dark:border-gray-700">
          <div className="px-6 py-4 border-b border-gray-200 dark:border-gray-700 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <ClockIcon className="h-5 w-5 text-gray-600 dark:text-gray-400" />
              <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
                Today&apos;s Appointments
              </h2>
            </div>
            <Link
              href="/appointments/new"
              className="text-sm text-blue-600 hover:text-blue-700 dark:text-blue-400 dark:hover:text-blue-300"
            >
              + New
            </Link>
          </div>
          <div className="p-6">
            {todayAppointments.length === 0 ? (
              <p className="text-gray-600 dark:text-gray-400 text-center py-8">
                No appointments scheduled for today.
              </p>
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
                          className={`text-xs px-2 py-1 rounded ${
                            appointment.appointment_type === "in_person"
                              ? "bg-blue-100 text-blue-700 dark:bg-blue-900 dark:text-blue-300"
                              : "bg-purple-100 text-purple-700 dark:bg-purple-900 dark:text-purple-300"
                          }`}
                        >
                          {appointment.appointment_type === "in_person" ? "In-Person" : "Online"}
                        </span>
                        {appointment.status === "confirmed" && (
                          <button
                            onClick={(e) => {
                              e.preventDefault()
                              handleStartSession(appointment)
                            }}
                            disabled={startingSessions.has(appointment.id)}
                            className="flex items-center gap-1 px-3 py-1 bg-green-600 text-white rounded hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed text-xs"
                            title="Start session"
                          >
                            <PlayCircle className="h-3 w-3" />
                            {startingSessions.has(appointment.id) ? "Starting..." : "Start"}
                          </button>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Upcoming Appointments Calendar */}
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow border border-gray-200 dark:border-gray-700">
          <div className="px-6 py-4 border-b border-gray-200 dark:border-gray-700 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <CalendarIcon className="h-5 w-5 text-gray-600 dark:text-gray-400" />
              <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
                Upcoming
              </h2>
            </div>
            <Link
              href="/calendar"
              className="text-sm text-blue-600 hover:text-blue-700 dark:text-blue-400 dark:hover:text-blue-300"
            >
              View Calendar
            </Link>
          </div>
          <div className="p-6">
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
          </div>
        </div>
      </div>

      {/* Quick Actions */}
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow border border-gray-200 dark:border-gray-700">
        <div className="px-6 py-4 border-b border-gray-200 dark:border-gray-700">
          <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
            Quick Actions
          </h2>
        </div>
        <div className="p-6 grid grid-cols-1 md:grid-cols-3 gap-4">
          <Link
            href="/clients/new"
            className="flex items-center gap-3 p-4 border-2 border-dashed border-gray-300 dark:border-gray-600 rounded-lg hover:border-blue-500 dark:hover:border-blue-400 transition-colors group"
          >
            <UserPlusIcon className="h-5 w-5 text-gray-400 group-hover:text-blue-500 dark:group-hover:text-blue-400" />
            <span className="text-gray-600 dark:text-gray-400 group-hover:text-blue-600 dark:group-hover:text-blue-400 font-medium">
              New Client
            </span>
          </Link>
          <Link
            href="/appointments/new"
            className="flex items-center gap-3 p-4 border-2 border-dashed border-gray-300 dark:border-gray-600 rounded-lg hover:border-blue-500 dark:hover:border-blue-400 transition-colors group"
          >
            <PlusIcon className="h-5 w-5 text-gray-400 group-hover:text-blue-500 dark:group-hover:text-blue-400" />
            <span className="text-gray-600 dark:text-gray-400 group-hover:text-blue-600 dark:group-hover:text-blue-400 font-medium">
              New Appointment
            </span>
          </Link>
          <Link
            href="/calendar"
            className="flex items-center gap-3 p-4 border-2 border-dashed border-gray-300 dark:border-gray-600 rounded-lg hover:border-blue-500 dark:hover:border-blue-400 transition-colors group"
          >
            <CalendarIcon className="h-5 w-5 text-gray-400 group-hover:text-blue-500 dark:group-hover:text-blue-400" />
            <span className="text-gray-600 dark:text-gray-400 group-hover:text-blue-600 dark:group-hover:text-blue-400 font-medium">
              View Calendar
            </span>
          </Link>
        </div>
      </div>
    </div>
  )
}
