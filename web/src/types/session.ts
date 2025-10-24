/**
 * Session Domain Types
 *
 * Business domain types for Client Session entity
 */

import type { Database } from './database'

/**
 * Session status enum
 */
export type SessionStatus = 'in_progress' | 'completed' | 'cancelled'

/**
 * File attachment metadata
 */
export interface SessionAttachment {
  id: string
  name: string
  url: string
  type: string // MIME type (e.g., 'image/png', 'application/pdf')
  size: number // File size in bytes
  uploaded_at: string // ISO 8601 datetime
}

/**
 * Client session entity type
 */
export interface ClientSession {
  id: string
  practice_id: string
  appointment_id: string
  client_id: string
  practitioner_id: string
  start_time: string
  end_time: string | null
  status: SessionStatus
  notes: string | null
  attachments: SessionAttachment[]
  created_at: string
  updated_at: string
}

/**
 * Data required to create a new session
 */
export interface CreateSessionDto {
  practice_id: string
  appointment_id: string
  client_id: string
  practitioner_id: string
  notes?: string | null
}

/**
 * Data allowed for session updates
 */
export interface UpdateSessionDto {
  end_time?: string | null
  status?: SessionStatus
  notes?: string | null
  attachments?: SessionAttachment[]
}

/**
 * Session with related appointment and client data (for UI)
 */
export interface SessionWithDetails extends ClientSession {
  appointment?: {
    id: string
    start_time: string
    end_time: string
    status: string
  }
  client?: {
    id: string
    first_name: string
    last_name: string
    email: string | null
  }
}

/**
 * Session list filters
 */
export interface SessionFilters {
  status?: SessionStatus
  client_id?: string
  start_date?: string // ISO 8601 date
  end_date?: string // ISO 8601 date
}
