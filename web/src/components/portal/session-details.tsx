"use client"

import { useState, useRef, useEffect } from "react"
import { sessionApi } from "@/lib/api/session-api"
import { fileApi } from "@/lib/api/file-api"
import { storageService } from "@/lib/services/storage-service"
import type { SessionWithDetails, SessionAttachment } from "@/types/session"
import type { FileRecord } from "@/types/file"
import {
  isAllowedFileType,
  isValidFileSize,
  formatFileSize,
  getFileIcon,
  MAX_FILE_SIZE,
  ALLOWED_FILE_TYPES,
} from "@/types/file"
import { format } from "date-fns"
import {
  ClockIcon,
  UserIcon,
  CalendarIcon,
  FileTextIcon,
  CheckCircle2Icon,
  XCircleIcon,
  UploadIcon,
  Trash2Icon,
  DownloadIcon,
  XIcon,
} from "lucide-react"

interface SessionDetailsProps {
  session: SessionWithDetails
  onSessionUpdate?: () => void
  onSessionEnd?: () => void
  showAppointmentInfo?: boolean
}

/**
 * SessionDetails component
 * Displays session information and allows editing notes and ending session
 * Can be embedded in appointment pages or used standalone
 */
export function SessionDetails({
  session,
  onSessionUpdate,
  onSessionEnd,
  showAppointmentInfo = false,
}: SessionDetailsProps) {
  const [notes, setNotes] = useState(session.notes || "")
  const [saving, setSaving] = useState(false)
  const [ending, setEnding] = useState(false)
  const [files, setFiles] = useState<FileRecord[]>([])
  const [uploading, setUploading] = useState(false)
  const [uploadProgress, setUploadProgress] = useState<{ [key: string]: number }>({})
  const [dragActive, setDragActive] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)

  // Load files on mount
  useEffect(() => {
    loadFiles()
  }, [session.id])

  async function loadFiles() {
    try {
      const fileRecords = await fileApi.getFilesByEntity('client_sessions', session.id)
      setFiles(fileRecords)
    } catch (err) {
      console.error('Failed to load files:', err)
    }
  }

  async function handleFileSelect(selectedFiles: FileList | null) {
    if (!selectedFiles || selectedFiles.length === 0) return

    const validFiles: File[] = []
    const errors: string[] = []

    // Validate files
    Array.from(selectedFiles).forEach((file) => {
      if (!isAllowedFileType(file)) {
        errors.push(`${file.name}: File type not allowed`)
        return
      }
      if (!isValidFileSize(file)) {
        errors.push(`${file.name}: File size exceeds ${formatFileSize(MAX_FILE_SIZE)}`)
        return
      }
      validFiles.push(file)
    })

    if (errors.length > 0) {
      alert(`Some files could not be uploaded:\n${errors.join('\n')}`)
    }

    if (validFiles.length === 0) return

    // Upload files
    setUploading(true)
    for (const file of validFiles) {
      try {
        // Upload to storage
        const { path, url } = await storageService.uploadFile(
          file,
          session.practice_id,
          'client_sessions',
          session.id
        )

        // Create file record in database
        await fileApi.createFile({
          practice_id: session.practice_id,
          entity_type: 'client_sessions',
          entity_id: session.id,
          bucket_name: 'session-files',
          file_path: path,
          file_name: file.name,
          file_type: file.type,
          file_size: file.size,
          uploaded_by: session.practitioner_id,
        })
      } catch (err) {
        console.error(`Failed to upload ${file.name}:`, err)
        alert(`Failed to upload ${file.name}`)
      }
    }

    setUploading(false)
    await loadFiles()
  }

  async function handleFileDelete(fileRecord: FileRecord) {
    if (!confirm(`Are you sure you want to delete ${fileRecord.file_name}?`)) return

    try {
      // Delete from storage
      await storageService.deleteFile(fileRecord.file_path)

      // Delete from database
      await fileApi.deleteFile(fileRecord.id)

      // Reload files
      await loadFiles()
    } catch (err) {
      console.error('Failed to delete file:', err)
      alert('Failed to delete file')
    }
  }

  function handleDrag(e: React.DragEvent) {
    e.preventDefault()
    e.stopPropagation()
    if (e.type === 'dragenter' || e.type === 'dragover') {
      setDragActive(true)
    } else if (e.type === 'dragleave') {
      setDragActive(false)
    }
  }

  function handleDrop(e: React.DragEvent) {
    e.preventDefault()
    e.stopPropagation()
    setDragActive(false)

    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      handleFileSelect(e.dataTransfer.files)
    }
  }

  function handleFileInputChange(e: React.ChangeEvent<HTMLInputElement>) {
    handleFileSelect(e.target.files)
  }

  function openFileDialog() {
    fileInputRef.current?.click()
  }

  async function handleSaveNotes() {
    try {
      setSaving(true)
      await sessionApi.update(session.id, { notes })
      if (onSessionUpdate) {
        onSessionUpdate()
      }
    } catch (err) {
      console.error("Failed to save notes:", err)
      alert("Failed to save notes")
    } finally {
      setSaving(false)
    }
  }

  async function handleEndSession() {
    const confirmed = window.confirm(
      "Are you sure you want to end this session? This will mark the appointment as completed."
    )

    if (!confirmed) return

    try {
      setEnding(true)
      await sessionApi.endSession(session.id, notes)
      if (onSessionEnd) {
        onSessionEnd()
      }
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
        <h2 className="text-2xl font-bold text-gray-900 dark:text-white">Client Session</h2>
        {getStatusBadge(session.status)}
      </div>

      {/* Session Info */}
      <div className={showAppointmentInfo ? "grid grid-cols-1 md:grid-cols-2 gap-6" : ""}>
        {/* Session Details Card */}
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow border border-gray-200 dark:border-gray-700 p-6">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
            Session Details
          </h3>
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

        {/* Appointment Details Card - Optional */}
        {showAppointmentInfo && session.appointment && (
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow border border-gray-200 dark:border-gray-700 p-6">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
              Related Appointment
            </h3>
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
            </div>
          </div>
        )}
      </div>

      {/* Session Notes */}
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow border border-gray-200 dark:border-gray-700 p-6">
        <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
          Session Notes
        </h3>
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
        <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
          File Attachments
        </h3>

        {/* Upload Area */}
        {session.status === "in_progress" && (
          <div className="mb-4">
            <input
              ref={fileInputRef}
              type="file"
              multiple
              accept={Object.keys(ALLOWED_FILE_TYPES).join(',')}
              onChange={handleFileInputChange}
              className="hidden"
            />
            <div
              onDragEnter={handleDrag}
              onDragLeave={handleDrag}
              onDragOver={handleDrag}
              onDrop={handleDrop}
              onClick={openFileDialog}
              className={`border-2 border-dashed rounded-lg p-8 text-center cursor-pointer transition-colors ${
                dragActive
                  ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/20'
                  : 'border-gray-300 dark:border-gray-600 hover:border-blue-400 dark:hover:border-blue-500'
              } ${uploading ? 'opacity-50 cursor-not-allowed' : ''}`}
            >
              <UploadIcon className="h-10 w-10 mx-auto mb-3 text-gray-400" />
              <p className="text-sm text-gray-600 dark:text-gray-400 mb-1">
                {uploading ? 'Uploading...' : 'Click to upload or drag and drop'}
              </p>
              <p className="text-xs text-gray-500 dark:text-gray-500">
                Max file size: {formatFileSize(MAX_FILE_SIZE)} • Allowed: Images, PDFs, Office files
              </p>
            </div>
          </div>
        )}

        {/* File List */}
        {files.length > 0 ? (
          <div className="space-y-2">
            {files.map((file) => (
              <div
                key={file.id}
                className="flex items-center justify-between p-3 border border-gray-200 dark:border-gray-700 rounded-lg"
              >
                <div className="flex items-center gap-3 flex-1 min-w-0">
                  <span className="text-2xl flex-shrink-0">{getFileIcon(file.file_type)}</span>
                  <div className="min-w-0 flex-1">
                    <div className="text-sm font-medium text-gray-900 dark:text-white truncate">
                      {file.file_name}
                    </div>
                    <div className="text-xs text-gray-600 dark:text-gray-400">
                      {formatFileSize(file.file_size)}
                    </div>
                  </div>
                </div>
                <div className="flex items-center gap-2 flex-shrink-0">
                  <a
                    href={storageService.getFileUrl(file.file_path)}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="p-2 text-blue-600 hover:text-blue-700 dark:text-blue-400 dark:hover:text-blue-300 hover:bg-blue-50 dark:hover:bg-blue-900/20 rounded"
                    title="Download"
                  >
                    <DownloadIcon className="h-4 w-4" />
                  </a>
                  {session.status === "in_progress" && (
                    <button
                      onClick={() => handleFileDelete(file)}
                      className="p-2 text-red-600 hover:text-red-700 dark:text-red-400 dark:hover:text-red-300 hover:bg-red-50 dark:hover:bg-red-900/20 rounded"
                      title="Delete"
                    >
                      <Trash2Icon className="h-4 w-4" />
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="text-center py-8 text-gray-600 dark:text-gray-400">
            <UploadIcon className="h-12 w-12 mx-auto mb-3 text-gray-400" />
            <p>No attachments yet</p>
            {session.status === "in_progress" && (
              <p className="text-sm mt-2">Upload files using the area above</p>
            )}
          </div>
        )}
      </div>
    </div>
  )
}
