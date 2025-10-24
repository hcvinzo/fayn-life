/**
 * Appointment Domain Types
 *
 * Business domain types for Appointment entity
 */

import type { Database } from './database'
import type { Client } from './client'

/**
 * Appointment entity type (mirrors database row)
 */
export type Appointment = Database['public']['Tables']['appointments']['Row']

/**
 * Data required to create a new appointment
 */
export type CreateAppointmentDto = {
  practice_id: string
  client_id: string
  practitioner_id: string
  start_time: string // ISO 8601 datetime
  end_time: string // ISO 8601 datetime
  appointment_type: 'in_person' | 'online'
  status?: 'scheduled' | 'confirmed' | 'completed' | 'cancelled' | 'no_show'
  notes?: string | null
}

/**
 * Data allowed for appointment updates
 */
export type UpdateAppointmentDto = Partial<
  Omit<CreateAppointmentDto, 'practice_id' | 'practitioner_id'>
>

/**
 * Appointment with related client data (for UI)
 */
export interface AppointmentWithClient extends Appointment {
  client: Client
}

/**
 * Appointment list filters
 */
export interface AppointmentFilters {
  status?: 'scheduled' | 'confirmed' | 'completed' | 'cancelled' | 'no_show'
  client_id?: string
  start_date?: string // ISO 8601 date
  end_date?: string // ISO 8601 date
}
