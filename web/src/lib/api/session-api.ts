/**
 * Session API Client
 *
 * Frontend HTTP client for session operations.
 * Used by Client Components to call session API routes.
 */

import { apiClient } from './client'
import type { ClientSession, CreateSessionDto, UpdateSessionDto, SessionFilters, SessionWithDetails } from '@/types/session'

export const sessionApi = {
  /**
   * Get all sessions for the practice
   * @param filters - Optional filters
   * @returns Array of sessions
   */
  async getAll(filters?: SessionFilters): Promise<ClientSession[]> {
    const params = new URLSearchParams()

    if (filters?.status) params.append('status', filters.status)
    if (filters?.client_id) params.append('client_id', filters.client_id)
    if (filters?.start_date) params.append('start_date', filters.start_date)
    if (filters?.end_date) params.append('end_date', filters.end_date)

    const query = params.toString()
    return apiClient.get<ClientSession[]>(`/sessions${query ? `?${query}` : ''}`)
  },

  /**
   * Get a specific session by ID
   * @param id - Session ID
   * @returns Session with details
   */
  async getById(id: string): Promise<SessionWithDetails> {
    return apiClient.get<SessionWithDetails>(`/sessions/${id}`)
  },

  /**
   * Get session by appointment ID
   * @param appointmentId - Appointment ID
   * @returns Session or null
   */
  async getByAppointment(appointmentId: string): Promise<ClientSession | null> {
    return apiClient.get<ClientSession | null>(`/sessions/appointment/${appointmentId}`)
  },

  /**
   * Create a new session
   * @param data - Session creation data
   * @returns Created session
   */
  async create(data: CreateSessionDto): Promise<ClientSession> {
    return apiClient.post<ClientSession>('/sessions', data)
  },

  /**
   * Update a session
   * @param id - Session ID
   * @param data - Session update data
   * @returns Updated session
   */
  async update(id: string, data: UpdateSessionDto): Promise<ClientSession> {
    return apiClient.patch<ClientSession>(`/sessions/${id}`, data)
  },

  /**
   * Delete a session
   * @param id - Session ID
   * @returns Success response
   */
  async delete(id: string): Promise<{ success: boolean }> {
    return apiClient.delete<{ success: boolean }>(`/sessions/${id}`)
  },

  /**
   * End a session (mark as completed)
   * @param id - Session ID
   * @param notes - Optional final notes
   * @returns Updated session
   */
  async endSession(id: string, notes?: string): Promise<ClientSession> {
    return this.update(id, {
      status: 'completed',
      end_time: new Date().toISOString(),
      notes,
    })
  },
}
