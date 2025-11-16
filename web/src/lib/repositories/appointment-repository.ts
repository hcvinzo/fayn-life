/**
 * Appointment Repository
 *
 * Data access layer for appointments.
 * Handles all database operations for the appointments table.
 */

import { BaseRepository } from './base-repository'
import type { Appointment, AppointmentFilters, AppointmentWithClient } from '@/types/appointment'
import type { Database } from '@/types/database'
import { DatabaseError } from '@/lib/utils/errors'

type AppointmentRow = Database['public']['Tables']['appointments']['Row']
type AppointmentInsert = Database['public']['Tables']['appointments']['Insert']
type AppointmentUpdate = Database['public']['Tables']['appointments']['Update']

export class AppointmentRepository extends BaseRepository<'appointments'> {
  constructor() {
    super('appointments')
  }

  /**
   * Find all appointments for a practice with optional filtering
   * @param practiceId - Practice ID to filter by
   * @param filters - Optional filters (status, client_id, date range)
   * @param practitionerId - Optional practitioner ID for role-based filtering (practitioners see only their own data)
   * @returns Array of appointments
   */
  async findByPractice(
    practiceId: string,
    filters?: AppointmentFilters,
    practitionerId?: string
  ): Promise<AppointmentRow[]> {
    try {
      let query = this.db
        .from(this.tableName)
        .select('*')
        .eq('practice_id', practiceId)
        .order('start_time', { ascending: true })

      // Apply practitioner filter (role-based access)
      if (practitionerId) {
        query = query.eq('practitioner_id', practitionerId)
      }

      // Apply status filter
      if (filters?.status) {
        query = query.eq('status', filters.status)
      }

      // Apply client filter
      if (filters?.client_id) {
        query = query.eq('client_id', filters.client_id)
      }

      // Apply date range filters
      if (filters?.start_date) {
        query = query.gte('start_time', filters.start_date)
      }

      if (filters?.end_date) {
        query = query.lte('start_time', filters.end_date)
      }

      const { data, error } = await query

      if (error) {
        throw new DatabaseError(`Failed to fetch appointments: ${error.message}`, error)
      }

      return (data as AppointmentRow[]) || []
    } catch (error) {
      if (error instanceof DatabaseError) throw error
      throw new DatabaseError('Unexpected error fetching appointments', error)
    }
  }

  /**
   * Find appointments with client details (JOIN)
   * @param practiceId - Practice ID to filter by
   * @param filters - Optional filters
   * @param practitionerId - Optional practitioner ID for role-based filtering (practitioners see only their own data)
   * @returns Array of appointments with client data
   */
  async findByPracticeWithClient(
    practiceId: string,
    filters?: AppointmentFilters,
    practitionerId?: string
  ): Promise<AppointmentWithClient[]> {
    try {
      let query = this.db
        .from(this.tableName)
        .select(`
          *,
          client:client_id (
            id,
            first_name,
            last_name,
            email,
            phone
          ),
          client_sessions!appointment_id (
            id
          )
        `)
        .eq('practice_id', practiceId)
        .order('start_time', { ascending: true })

      // Apply practitioner filter (role-based access)
      if (practitionerId) {
        query = query.eq('practitioner_id', practitionerId)
      }

      // Apply filters
      if (filters?.status) {
        query = query.eq('status', filters.status)
      }

      if (filters?.client_id) {
        query = query.eq('client_id', filters.client_id)
      }

      if (filters?.start_date) {
        query = query.gte('start_time', filters.start_date)
      }

      if (filters?.end_date) {
        query = query.lte('start_time', filters.end_date)
      }

      const { data, error } = await query

      if (error) {
        throw new DatabaseError(`Failed to fetch appointments with client: ${error.message}`, error)
      }

      // Map the data to include has_session flag
      const appointments = (data as any[])?.map((appt) => ({
        ...appt,
        has_session: appt.client_sessions && appt.client_sessions.length > 0,
        client_sessions: undefined, // Remove the sessions array from the response
      })) || []

      return appointments
    } catch (error) {
      if (error instanceof DatabaseError) throw error
      throw new DatabaseError('Unexpected error fetching appointments with client', error)
    }
  }

  /**
   * Find appointment by ID (with practice_id check for RLS)
   * @param id - Appointment ID
   * @param practiceId - Practice ID for authorization
   * @returns Appointment or null
   */
  async findByIdAndPractice(id: string, practiceId: string): Promise<AppointmentRow | null> {
    return this.findOne({ id, practice_id: practiceId } as any)
  }

  /**
   * Find appointments for a client
   * @param clientId - Client ID
   * @param practiceId - Practice ID for authorization
   * @returns Array of appointments
   */
  async findByClient(clientId: string, practiceId: string): Promise<AppointmentRow[]> {
    return this.findAll({ client_id: clientId, practice_id: practiceId } as any)
  }

  /**
   * Find appointments for a practitioner
   * @param practitionerId - Practitioner ID
   * @param practiceId - Practice ID for authorization
   * @param filters - Optional filters
   * @returns Array of appointments
   */
  async findByPractitioner(
    practitionerId: string,
    practiceId: string,
    filters?: AppointmentFilters
  ): Promise<AppointmentRow[]> {
    try {
      let query = this.db
        .from(this.tableName)
        .select('*')
        .eq('practice_id', practiceId)
        .eq('practitioner_id', practitionerId)
        .order('start_time', { ascending: true })

      if (filters?.status) {
        query = query.eq('status', filters.status)
      }

      if (filters?.start_date) {
        query = query.gte('start_time', filters.start_date)
      }

      if (filters?.end_date) {
        query = query.lte('start_time', filters.end_date)
      }

      const { data, error } = await query

      if (error) {
        throw new DatabaseError(`Failed to fetch practitioner appointments: ${error.message}`, error)
      }

      return (data as AppointmentRow[]) || []
    } catch (error) {
      if (error instanceof DatabaseError) throw error
      throw new DatabaseError('Unexpected error fetching practitioner appointments', error)
    }
  }

  /**
   * Check for conflicting appointments (time overlap)
   * @param practitionerId - Practitioner ID
   * @param startTime - Start time
   * @param endTime - End time
   * @param excludeAppointmentId - Optional appointment ID to exclude (for updates)
   * @returns True if conflict exists
   *
   * Two time ranges overlap if: start_time < new_end_time AND end_time > new_start_time
   */
  async hasConflict(
    practitionerId: string,
    startTime: string,
    endTime: string,
    excludeAppointmentId?: string
  ): Promise<boolean> {
    try {
      let query = this.db
        .from(this.tableName)
        .select('id')
        .eq('practitioner_id', practitionerId)
        .neq('status', 'cancelled')
        .lt('start_time', endTime)      // Existing appointment starts before new appointment ends
        .gt('end_time', startTime)      // Existing appointment ends after new appointment starts

      if (excludeAppointmentId) {
        query = query.neq('id', excludeAppointmentId)
      }

      const { data, error } = await query.limit(1)

      if (error) {
        throw new DatabaseError(`Failed to check appointment conflict: ${error.message}`, error)
      }

      return (data?.length || 0) > 0
    } catch (error) {
      if (error instanceof DatabaseError) throw error
      throw new DatabaseError('Unexpected error checking appointment conflict', error)
    }
  }

  /**
   * Count appointments by status for a practice
   * @param practiceId - Practice ID
   * @param status - Optional status filter
   * @param practitionerId - Optional practitioner ID for role-based filtering
   * @returns Count of appointments
   */
  async countByPractice(
    practiceId: string,
    status?: 'scheduled' | 'confirmed' | 'completed' | 'cancelled' | 'no_show',
    practitionerId?: string
  ): Promise<number> {
    const filters: any = { practice_id: practiceId }
    if (status) {
      filters.status = status
    }
    if (practitionerId) {
      filters.practitioner_id = practitionerId
    }
    return this.count(filters)
  }

  /**
   * Create a new appointment
   * @param data - Appointment data
   * @returns Created appointment
   */
  async createAppointment(data: AppointmentInsert): Promise<AppointmentRow> {
    return this.create(data)
  }

  /**
   * Update an appointment
   * @param id - Appointment ID
   * @param data - Appointment data to update
   * @returns Updated appointment
   */
  async updateAppointment(id: string, data: AppointmentUpdate): Promise<AppointmentRow> {
    return this.update(id, data)
  }

  /**
   * Delete an appointment
   * @param id - Appointment ID
   * @returns True if deleted
   */
  async deleteAppointment(id: string): Promise<boolean> {
    return this.delete(id)
  }
}

// Export singleton instance
export const appointmentRepository = new AppointmentRepository()
