/**
 * Session Repository
 *
 * Data access layer for client sessions.
 * Handles all database operations for the client_sessions table.
 */

import { BaseRepository } from './base-repository'
import type { ClientSession, SessionFilters, SessionWithDetails } from '@/types/session'
import type { Database } from '@/types/database'
import { DatabaseError } from '@/lib/utils/errors'

type SessionRow = Database['public']['Tables']['client_sessions']['Row']
type SessionInsert = Database['public']['Tables']['client_sessions']['Insert']
type SessionUpdate = Database['public']['Tables']['client_sessions']['Update']

export class SessionRepository extends BaseRepository<'client_sessions'> {
  constructor() {
    super('client_sessions')
  }

  /**
   * Find all sessions for a practice with optional filtering
   * @param practiceId - Practice ID to filter by
   * @param filters - Optional filters (status, client_id, date range)
   * @returns Array of sessions
   */
  async findByPractice(
    practiceId: string,
    filters?: SessionFilters
  ): Promise<SessionRow[]> {
    try {
      let query = this.db
        .from(this.tableName)
        .select('*')
        .eq('practice_id', practiceId)
        .order('start_time', { ascending: false })

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
        throw new DatabaseError(`Failed to fetch sessions: ${error.message}`, error)
      }

      return (data as SessionRow[]) || []
    } catch (error) {
      if (error instanceof DatabaseError) throw error
      throw new DatabaseError('Unexpected error fetching sessions', error)
    }
  }

  /**
   * Find session by appointment ID
   * @param appointmentId - Appointment ID
   * @returns Session or null
   */
  async findByAppointment(appointmentId: string): Promise<SessionRow | null> {
    try {
      const { data, error } = await this.db
        .from(this.tableName)
        .select('*')
        .eq('appointment_id', appointmentId)
        .single()

      if (error) {
        // Not found is okay, return null
        if (error.code === 'PGRST116') return null
        throw new DatabaseError(`Failed to fetch session by appointment: ${error.message}`, error)
      }

      return data as SessionRow
    } catch (error) {
      if (error instanceof DatabaseError) throw error
      throw new DatabaseError('Unexpected error fetching session by appointment', error)
    }
  }

  /**
   * Find session by ID with related details (appointment and client)
   * @param id - Session ID
   * @param practiceId - Practice ID for authorization
   * @returns Session with details or null
   */
  async findByIdWithDetails(id: string, practiceId: string): Promise<SessionWithDetails | null> {
    try {
      const { data, error } = await this.db
        .from(this.tableName)
        .select(`
          *,
          appointment:appointment_id (
            id,
            start_time,
            end_time,
            status
          ),
          client:client_id (
            id,
            first_name,
            last_name,
            email
          )
        `)
        .eq('id', id)
        .eq('practice_id', practiceId)
        .single()

      if (error) {
        // Not found is okay, return null
        if (error.code === 'PGRST116') return null
        throw new DatabaseError(`Failed to fetch session with details: ${error.message}`, error)
      }

      return data as any
    } catch (error) {
      if (error instanceof DatabaseError) throw error
      throw new DatabaseError('Unexpected error fetching session with details', error)
    }
  }

  /**
   * Find session by ID (with practice_id check for RLS)
   * @param id - Session ID
   * @param practiceId - Practice ID for authorization
   * @returns Session or null
   */
  async findByIdAndPractice(id: string, practiceId: string): Promise<SessionRow | null> {
    return this.findOne({ id, practice_id: practiceId } as any)
  }

  /**
   * Find sessions for a client
   * @param clientId - Client ID
   * @param practiceId - Practice ID for authorization
   * @returns Array of sessions
   */
  async findByClient(clientId: string, practiceId: string): Promise<SessionRow[]> {
    return this.findAll({ client_id: clientId, practice_id: practiceId } as any)
  }

  /**
   * Count sessions by status for a practice
   * @param practiceId - Practice ID
   * @param status - Optional status filter
   * @returns Count of sessions
   */
  async countByPractice(
    practiceId: string,
    status?: 'in_progress' | 'completed' | 'cancelled'
  ): Promise<number> {
    const filters: any = { practice_id: practiceId }
    if (status) {
      filters.status = status
    }
    return this.count(filters)
  }

  /**
   * Create a new session
   * @param data - Session data
   * @returns Created session
   */
  async createSession(data: SessionInsert): Promise<SessionRow> {
    return this.create(data)
  }

  /**
   * Update a session
   * @param id - Session ID
   * @param data - Session data to update
   * @returns Updated session
   */
  async updateSession(id: string, data: SessionUpdate): Promise<SessionRow> {
    return this.update(id, data)
  }

  /**
   * Delete a session
   * @param id - Session ID
   * @returns True if deleted
   */
  async deleteSession(id: string): Promise<boolean> {
    return this.delete(id)
  }

  /**
   * Check if appointment already has a session
   * @param appointmentId - Appointment ID
   * @returns True if session exists
   */
  async hasSession(appointmentId: string): Promise<boolean> {
    try {
      const { count, error } = await this.db
        .from(this.tableName)
        .select('id', { count: 'exact', head: true })
        .eq('appointment_id', appointmentId)
        .limit(1)

      if (error) {
        throw new DatabaseError(`Failed to check session existence: ${error.message}`, error)
      }

      return (count || 0) > 0
    } catch (error) {
      if (error instanceof DatabaseError) throw error
      throw new DatabaseError('Unexpected error checking session existence', error)
    }
  }
}

// Export singleton instance
export const sessionRepository = new SessionRepository()
