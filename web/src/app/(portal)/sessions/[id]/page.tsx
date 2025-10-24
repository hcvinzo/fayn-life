"use client"

import { useEffect, useState } from "react"
import { useParams, useRouter } from "next/navigation"
import { sessionApi } from "@/lib/api/session-api"
import type { SessionWithDetails, SessionAttachment } from "@/types/session"
import { format } from "date-fns"
import Link from "next/link"
import {
  ArrowLeftIcon,
  ClockIcon,
  UserIcon,
  CalendarIcon,
  FileTextIcon,
  CheckCircle2Icon,
  XCircleIcon,
  UploadIcon,
} from "lucide-react"

/**
 * Session detail page
 * Displays session information and allows editing notes and ending session
 */
export default function SessionDetailPage() {
  const params = useParams()
  const router = useRouter()
  const sessionId = params.id as string

  const [session, setSession] = useState<SessionWithDetails | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [notes, setNotes] = useState("")
  const [saving, setSaving] = useState(false)
  const [ending, setEnding] = useState(false)

  useEffect(() => {
    loadSession()
  }, [sessionId])

  async function loadSession() {
    try {
      setLoading(true)
      setError(null)
      const data = await sessionApi.getById(sessionId)
      setSession(data)
      setNotes(data.notes || "")
    } catch (err) {
      console.error("Failed to load session:", err)
      setError("Failed to load session")
    } finally {
      setLoading(false)
    }
  }

  async function handleSaveNotes() {
    if (!session) return

    try {
      setSaving(true)
      await sessionApi.update(sessionId, { notes })
      await loadSession() // Reload to get updated data
    } catch (err) {
      console.error("Failed to save notes:", err)
      alert("Failed to save notes")
    } finally {
      setSaving(false)
    }
  }

  async function handleEndSession() {
    if (!session) return

    const confirmed = window.confirm(
      "Are you sure you want to end this session? This will mark the appointment as completed."
    )

    if (!confirmed) return

    try {
      setEnding(true)
      await sessionApi.endSession(sessionId, notes)
      router.push(`/appointments/${session.appointment_id}`)
    } catch (err) {
      console.error("Failed to end session:", err)
      alert("Failed to end session")
    } finally {
      setEnding(false)
    }
  }

  function getStatusBadge(status: string) {
    switch (status) {
      case "in_progress":
        return (
          <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full text-sm font-medium bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200">
            <ClockIcon className="h-4 w-4" />
            In Progress
          </span>
        )
      case "completed":
        return (
          <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full text-sm font-medium bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200">
            <CheckCircle2Icon className="h-4 w-4" />
            Completed
          </span>
        )
      case "cancelled":
        return (
          <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full text-sm font-medium bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200">
            <XCircleIcon className="h-4 w-4" />
            Cancelled
          </span>
        )
      default:
        return null
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-gray-600 dark:text-gray-400">Loading session...</div>
      </div>
    )
  }

  if (error || !session) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[400px] gap-4">
        <div className="text-red-600 dark:text-red-400">{error || "Session not found"}</div>
        <Link
          href="/appointments"
          className="text-blue-600 hover:text-blue-700 dark:text-blue-400 dark:hover:text-blue-300"
        >
          ← Back to Appointments
        </Link>
      </div>
    )
  }

  const duration = session.end_time
    ? Math.round(
        (new Date(session.end_time).getTime() - new Date(session.start_time).getTime()) /
          1000 /
          60
      )
    : Math.round((new Date().getTime() - new Date(session.start_time).getTime()) / 1000 / 60)

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Link
            href={`/appointments/${session.appointment_id}`}
            className="text-gray-600 hover:text-gray-900 dark:text-gray-400 dark:hover:text-gray-100"
          >
            <ArrowLeftIcon className="h-5 w-5" />
          </Link>
          <div>
            <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
              Client Session
            </h1>
            <p className="mt-1 text-gray-600 dark:text-gray-400">
              Session with {session.client?.first_name} {session.client?.last_name}
            </p>
          </div>
        </div>
        <div>{getStatusBadge(session.status)}</div>
      </div>

      {/* Session Info */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Session Details Card */}
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow border border-gray-200 dark:border-gray-700 p-6">
          <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
            Session Details
          </h2>
          <div className="space-y-4">
            <div className="flex items-start gap-3">
              <UserIcon className="h-5 w-5 text-gray-400 mt-0.5" />
              <div>
                <div className="text-sm text-gray-600 dark:text-gray-400">Client</div>
                <div className="text-gray-900 dark:text-white font-medium">
                  {session.client?.first_name} {session.client?.last_name}
                </div>
                {session.client?.email && (
                  <div className="text-sm text-gray-600 dark:text-gray-400">
                    {session.client.email}
                  </div>
                )}
              </div>
            </div>

            <div className="flex items-start gap-3">
              <ClockIcon className="h-5 w-5 text-gray-400 mt-0.5" />
              <div>
                <div className="text-sm text-gray-600 dark:text-gray-400">Started</div>
                <div className="text-gray-900 dark:text-white font-medium">
                  {format(new Date(session.start_time), "PPP 'at' p")}
                </div>
              </div>
            </div>

            {session.end_time && (
              <div className="flex items-start gap-3">
                <CheckCircle2Icon className="h-5 w-5 text-gray-400 mt-0.5" />
                <div>
                  <div className="text-sm text-gray-600 dark:text-gray-400">Ended</div>
                  <div className="text-gray-900 dark:text-white font-medium">
                    {format(new Date(session.end_time), "PPP 'at' p")}
                  </div>
                </div>
              </div>
            )}

            <div className="flex items-start gap-3">
              <CalendarIcon className="h-5 w-5 text-gray-400 mt-0.5" />
              <div>
                <div className="text-sm text-gray-600 dark:text-gray-400">Duration</div>
                <div className="text-gray-900 dark:text-white font-medium">
                  {duration} minutes {!session.end_time && "(ongoing)"}
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Appointment Details Card */}
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow border border-gray-200 dark:border-gray-700 p-6">
          <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
            Related Appointment
          </h2>
          {session.appointment && (
            <div className="space-y-4">
              <div className="flex items-start gap-3">
                <CalendarIcon className="h-5 w-5 text-gray-400 mt-0.5" />
                <div>
                  <div className="text-sm text-gray-600 dark:text-gray-400">Scheduled Time</div>
                  <div className="text-gray-900 dark:text-white font-medium">
                    {format(new Date(session.appointment.start_time), "PPP")}
                  </div>
                  <div className="text-sm text-gray-600 dark:text-gray-400">
                    {format(new Date(session.appointment.start_time), "p")} -{" "}
                    {format(new Date(session.appointment.end_time), "p")}
                  </div>
                </div>
              </div>

              <div className="flex items-start gap-3">
                <FileTextIcon className="h-5 w-5 text-gray-400 mt-0.5" />
                <div>
                  <div className="text-sm text-gray-600 dark:text-gray-400">Status</div>
                  <div className="text-gray-900 dark:text-white font-medium capitalize">
                    {session.appointment.status.replace("_", " ")}
                  </div>
                </div>
              </div>

              <Link
                href={`/appointments/${session.appointment_id}`}
                className="inline-flex items-center text-sm text-blue-600 hover:text-blue-700 dark:text-blue-400 dark:hover:text-blue-300"
              >
                View Appointment Details →
              </Link>
            </div>
          )}
        </div>
      </div>

      {/* Session Notes */}
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow border border-gray-200 dark:border-gray-700 p-6">
        <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
          Session Notes
        </h2>
        <textarea
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
          disabled={session.status === "completed" || session.status === "cancelled"}
          rows={10}
          className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-700 dark:text-white disabled:opacity-50 disabled:cursor-not-allowed"
          placeholder="Enter session notes here..."
        />
        <div className="mt-4 flex gap-3">
          {session.status === "in_progress" && (
            <>
              <button
                onClick={handleSaveNotes}
                disabled={saving}
                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {saving ? "Saving..." : "Save Notes"}
              </button>
              <button
                onClick={handleEndSession}
                disabled={ending}
                className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {ending ? "Ending..." : "End Session"}
              </button>
            </>
          )}
        </div>
      </div>

      {/* File Attachments */}
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow border border-gray-200 dark:border-gray-700 p-6">
        <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
          File Attachments
        </h2>
        {session.attachments && session.attachments.length > 0 ? (
          <div className="space-y-2">
            {session.attachments.map((attachment: SessionAttachment) => (
              <div
                key={attachment.id}
                className="flex items-center justify-between p-3 border border-gray-200 dark:border-gray-700 rounded-lg"
              >
                <div className="flex items-center gap-3">
                  <FileTextIcon className="h-5 w-5 text-gray-400" />
                  <div>
                    <div className="text-sm font-medium text-gray-900 dark:text-white">
                      {attachment.name}
                    </div>
                    <div className="text-xs text-gray-600 dark:text-gray-400">
                      {(attachment.size / 1024).toFixed(2)} KB
                    </div>
                  </div>
                </div>
                <a
                  href={attachment.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-sm text-blue-600 hover:text-blue-700 dark:text-blue-400 dark:hover:text-blue-300"
                >
                  Download
                </a>
              </div>
            ))}
          </div>
        ) : (
          <div className="text-center py-8 text-gray-600 dark:text-gray-400">
            <UploadIcon className="h-12 w-12 mx-auto mb-3 text-gray-400" />
            <p>No attachments yet</p>
            {session.status === "in_progress" && (
              <p className="text-sm mt-2">File upload feature coming soon</p>
            )}
          </div>
        )}
      </div>
    </div>
  )
}
