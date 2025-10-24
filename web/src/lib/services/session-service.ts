/**
 * Session Service
 *
 * Business logic layer for client session operations.
 * Orchestrates session repository calls and applies business rules.
 */

import { sessionRepository } from '@/lib/repositories/session-repository'
import { appointmentRepository } from '@/lib/repositories/appointment-repository'
import type { CreateSessionDto, UpdateSessionDto, ClientSession, SessionFilters, SessionWithDetails } from '@/types/session'
import { ValidationError, NotFoundError, ConflictError, InternalServerError } from '@/lib/utils/errors'

export class SessionService {
  /**
   * Get all sessions for a practice
   * @param practiceId - Practice ID
   * @param filters - Optional filters
   * @returns Array of sessions
   */
  async getSessionsByPractice(
    practiceId: string,
    filters?: SessionFilters
  ): Promise<ClientSession[]> {
    try {
      if (!practiceId) {
        throw new ValidationError('Practice ID is required')
      }

      const sessions = await sessionRepository.findByPractice(practiceId, filters)
      return sessions.map(session => ({
        ...session,
        attachments: Array.isArray(session.attachments) ? session.attachments : [],
      })) as unknown as ClientSession[]
    } catch (error) {
      if (error instanceof ValidationError) throw error
      throw new InternalServerError('Failed to fetch sessions')
    }
  }

  /**
   * Get session by ID with details
   * @param id - Session ID
   * @param practiceId - Practice ID
   * @returns Session with details
   */
  async getSessionById(id: string, practiceId: string): Promise<SessionWithDetails> {
    try {
      if (!id || !practiceId) {
        throw new ValidationError('Session ID and Practice ID are required')
      }

      const session = await sessionRepository.findByIdWithDetails(id, practiceId)

      if (!session) {
        throw new NotFoundError('Session not found')
      }

      return session
    } catch (error) {
      if (error instanceof ValidationError || error instanceof NotFoundError) throw error
      throw new InternalServerError('Failed to fetch session')
    }
  }

  /**
   * Get session by appointment ID
   * @param appointmentId - Appointment ID
   * @returns Session or null
   */
  async getSessionByAppointment(appointmentId: string): Promise<ClientSession | null> {
    try {
      if (!appointmentId) {
        throw new ValidationError('Appointment ID is required')
      }

      const session = await sessionRepository.findByAppointment(appointmentId)
      if (!session) return null
      return {
        ...session,
        attachments: Array.isArray(session.attachments) ? session.attachments : [],
      } as unknown as ClientSession
    } catch (error) {
      if (error instanceof ValidationError) throw error
      throw new InternalServerError('Failed to fetch session by appointment')
    }
  }

  /**
   * Create a new session
   * @param data - Session creation data
   * @returns Created session
   */
  async createSession(data: CreateSessionDto): Promise<ClientSession> {
    try {
      // Validate required fields
      if (!data.practice_id || !data.appointment_id || !data.client_id || !data.practitioner_id) {
        throw new ValidationError('All required fields must be provided')
      }

      // Check if appointment exists and is confirmed
      const appointment = await appointmentRepository.findByIdAndPractice(
        data.appointment_id,
        data.practice_id
      )

      if (!appointment) {
        throw new NotFoundError('Appointment not found')
      }

      // Only allow sessions for confirmed appointments
      if (appointment.status !== 'confirmed') {
        throw new ValidationError('Only confirmed appointments can have sessions')
      }

      // Check if session already exists for this appointment
      const existingSession = await sessionRepository.findByAppointment(data.appointment_id)

      if (existingSession) {
        throw new ConflictError('Session already exists for this appointment')
      }

      // Create session with default status 'in_progress'
      // Note: attachments field is omitted - database default will set it to []
      const session = await sessionRepository.createSession({
        practice_id: data.practice_id,
        appointment_id: data.appointment_id,
        client_id: data.client_id,
        practitioner_id: data.practitioner_id,
        status: 'in_progress',
        notes: data.notes || null,
      })

      return {
        ...session,
        attachments: Array.isArray(session.attachments) ? session.attachments : [],
      } as unknown as ClientSession
    } catch (error) {
      if (error instanceof ValidationError || error instanceof NotFoundError || error instanceof ConflictError) {
        throw error
      }
      throw new InternalServerError('Failed to create session')
    }
  }

  /**
   * Update a session
   * @param id - Session ID
   * @param data - Session update data
   * @param practiceId - Practice ID for authorization
   * @returns Updated session
   */
  async updateSession(
    id: string,
    data: UpdateSessionDto,
    practiceId: string
  ): Promise<ClientSession> {
    try {
      if (!id || !practiceId) {
        throw new ValidationError('Session ID and Practice ID are required')
      }

      // Check if session exists
      const existingSession = await sessionRepository.findByIdAndPractice(id, practiceId)

      if (!existingSession) {
        throw new NotFoundError('Session not found')
      }

      // If status is being changed to 'completed', set end_time if not provided
      const updateData: any = { ...data }

      if (data.status === 'completed' && !data.end_time) {
        updateData.end_time = new Date().toISOString()
      }

      // Update session
      const session = await sessionRepository.updateSession(id, updateData)

      // If session is completed, update appointment status to completed
      if (data.status === 'completed') {
        await appointmentRepository.updateAppointment(existingSession.appointment_id, {
          status: 'completed',
        })
      }

      return {
        ...session,
        attachments: Array.isArray(session.attachments) ? session.attachments : [],
      } as unknown as ClientSession
    } catch (error) {
      if (error instanceof ValidationError || error instanceof NotFoundError) throw error
      throw new InternalServerError('Failed to update session')
    }
  }

  /**
   * Delete a session
   * @param id - Session ID
   * @param practiceId - Practice ID for authorization
   * @returns True if deleted
   */
  async deleteSession(id: string, practiceId: string): Promise<boolean> {
    try {
      if (!id || !practiceId) {
        throw new ValidationError('Session ID and Practice ID are required')
      }

      // Check if session exists
      const session = await sessionRepository.findByIdAndPractice(id, practiceId)

      if (!session) {
        throw new NotFoundError('Session not found')
      }

      return await sessionRepository.deleteSession(id)
    } catch (error) {
      if (error instanceof ValidationError || error instanceof NotFoundError) throw error
      throw new InternalServerError('Failed to delete session')
    }
  }
}

// Export singleton instance for server-side usage
export const serverSessionService = new SessionService()
