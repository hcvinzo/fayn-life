/**
 * Appointment API Client
 *
 * Frontend HTTP client for appointment operations.
 */

import { apiClient } from './client'
import type { Client } from './client-api'

export interface Appointment {
  id: string
  practice_id: string
  client_id: string
  practitioner_id: string
  start_time: string
  end_time: string
  status: 'scheduled' | 'confirmed' | 'completed' | 'cancelled' | 'no_show'
  notes: string | null
  created_at: string
  updated_at: string
}

export interface AppointmentWithClient extends Appointment {
  client: Client
}

export interface CreateAppointmentInput {
  client_id: string
  start_time: string // ISO 8601 datetime
  end_time: string // ISO 8601 datetime
  status?: 'scheduled' | 'confirmed' | 'completed' | 'cancelled' | 'no_show'
  notes?: string | null
}

export interface UpdateAppointmentInput {
  client_id?: string
  start_time?: string
  end_time?: string
  status?: 'scheduled' | 'confirmed' | 'completed' | 'cancelled' | 'no_show'
  notes?: string | null
}

export interface AppointmentFilters {
  status?: 'scheduled' | 'confirmed' | 'completed' | 'cancelled' | 'no_show'
  client_id?: string
  start_date?: string // ISO 8601 date
  end_date?: string // ISO 8601 date
  include_client?: boolean
}

export interface AppointmentStats {
  total: number
  scheduled: number
  confirmed: number
  completed: number
  cancelled: number
  no_show: number
}

/**
 * Appointment API methods
 */
export const appointmentApi = {
  /**
   * Get all appointments for user's practice with optional filters
   * @param filters - Optional filters (status, client_id, date range, include_client)
   * @returns List of appointments
   */
  getAll: (filters?: AppointmentFilters) => {
    const params = new URLSearchParams()
    if (filters?.status) params.append('status', filters.status)
    if (filters?.client_id) params.append('client_id', filters.client_id)
    if (filters?.start_date) params.append('start_date', filters.start_date)
    if (filters?.end_date) params.append('end_date', filters.end_date)
    if (filters?.include_client) params.append('include_client', 'true')

    const queryString = params.toString()
    return apiClient.get<Appointment[] | AppointmentWithClient[]>(
      `/appointments${queryString ? `?${queryString}` : ''}`
    )
  },

  /**
   * Get appointment by ID
   * @param id - Appointment ID
   * @returns Appointment details
   */
  getById: (id: string) =>
    apiClient.get<Appointment>(`/appointments/${id}`),

  /**
   * Create a new appointment
   * @param data - Appointment data
   * @returns Created appointment
   */
  create: (data: CreateAppointmentInput) =>
    apiClient.post<Appointment>('/appointments', data),

  /**
   * Update an appointment
   * @param id - Appointment ID
   * @param data - Appointment data to update
   * @returns Updated appointment
   */
  update: (id: string, data: UpdateAppointmentInput) =>
    apiClient.put<Appointment>(`/appointments/${id}`, data),

  /**
   * Cancel an appointment (sets status to cancelled)
   * @param id - Appointment ID
   * @returns Updated appointment
   */
  cancel: (id: string) =>
    apiClient.post<Appointment>(`/appointments/${id}/cancel`, {}),

  /**
   * Delete an appointment (hard delete)
   * @param id - Appointment ID
   * @returns Success message
   */
  delete: (id: string) =>
    apiClient.delete<{ message: string }>(`/appointments/${id}`),

  /**
   * Get appointment statistics for practice
   * @returns Appointment statistics
   */
  getStats: () =>
    apiClient.get<AppointmentStats>('/appointments/stats'),
}
