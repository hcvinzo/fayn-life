/**
 * Appointment Service
 *
 * Business logic for appointment-related operations.
 * Handles validation, authorization, conflict checking, and orchestrates repository calls.
 */

import { appointmentRepository } from '@/lib/repositories/appointment-repository'
import { createAppointmentSchema, updateAppointmentSchema } from '@/lib/validators/appointment-schema'
import type { CreateAppointmentInput, UpdateAppointmentInput } from '@/lib/validators/appointment-schema'
import type { Appointment, AppointmentFilters, AppointmentWithClient } from '@/types/appointment'
import { z } from 'zod'

export interface ServiceResult<T> {
  success: boolean
  data?: T
  error?: string
}

/**
 * Appointment Service Class
 * Handles all appointment-related business logic
 */
export class AppointmentService {
  /**
   * Get all appointments for a practice with optional filtering
   * @param practiceId - Practice ID
   * @param filters - Optional filters (status, client_id, date range)
   * @param userId - User ID for authorization
   * @returns List of appointments
   */
  async getAppointmentsByPractice(
    practiceId: string,
    filters?: AppointmentFilters,
    userId?: string
  ): Promise<ServiceResult<Appointment[]>> {
    try {
      // TODO: Add authorization - verify user belongs to practice

      const appointments = await appointmentRepository.findByPractice(practiceId, filters)

      return {
        success: true,
        data: appointments,
      }
    } catch (error) {
      console.error('Error fetching appointments:', error)
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to fetch appointments',
      }
    }
  }

  /**
   * Get appointments with client details
   * @param practiceId - Practice ID
   * @param filters - Optional filters
   * @param userId - User ID for authorization
   * @returns List of appointments with client data
   */
  async getAppointmentsWithClient(
    practiceId: string,
    filters?: AppointmentFilters,
    userId?: string
  ): Promise<ServiceResult<AppointmentWithClient[]>> {
    try {
      // TODO: Add authorization - verify user belongs to practice

      const appointments = await appointmentRepository.findByPracticeWithClient(practiceId, filters)

      return {
        success: true,
        data: appointments,
      }
    } catch (error) {
      console.error('Error fetching appointments with client:', error)
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to fetch appointments',
      }
    }
  }

  /**
   * Get appointment by ID
   * @param id - Appointment ID
   * @param practiceId - Practice ID for authorization
   * @param userId - User ID for authorization
   * @returns Appointment or null
   */
  async getAppointmentById(
    id: string,
    practiceId: string,
    userId?: string
  ): Promise<ServiceResult<Appointment | null>> {
    try {
      // TODO: Add authorization - verify user belongs to practice

      const appointment = await appointmentRepository.findByIdAndPractice(id, practiceId)

      if (!appointment) {
        return {
          success: false,
          error: 'Appointment not found',
        }
      }

      return {
        success: true,
        data: appointment,
      }
    } catch (error) {
      console.error('Error fetching appointment:', error)
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to fetch appointment',
      }
    }
  }

  /**
   * Get appointments for a specific client
   * @param clientId - Client ID
   * @param practiceId - Practice ID for authorization
   * @param userId - User ID for authorization
   * @returns List of appointments
   */
  async getAppointmentsByClient(
    clientId: string,
    practiceId: string,
    userId?: string
  ): Promise<ServiceResult<Appointment[]>> {
    try {
      // TODO: Add authorization - verify user belongs to practice

      const appointments = await appointmentRepository.findByClient(clientId, practiceId)

      return {
        success: true,
        data: appointments,
      }
    } catch (error) {
      console.error('Error fetching client appointments:', error)
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to fetch client appointments',
      }
    }
  }

  /**
   * Get appointments for a practitioner
   * @param practitionerId - Practitioner ID
   * @param practiceId - Practice ID for authorization
   * @param filters - Optional filters
   * @param userId - User ID for authorization
   * @returns List of appointments
   */
  async getAppointmentsByPractitioner(
    practitionerId: string,
    practiceId: string,
    filters?: AppointmentFilters,
    userId?: string
  ): Promise<ServiceResult<Appointment[]>> {
    try {
      // TODO: Add authorization - verify user is the practitioner or has permission

      const appointments = await appointmentRepository.findByPractitioner(
        practitionerId,
        practiceId,
        filters
      )

      return {
        success: true,
        data: appointments,
      }
    } catch (error) {
      console.error('Error fetching practitioner appointments:', error)
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to fetch practitioner appointments',
      }
    }
  }

  /**
   * Create a new appointment
   * @param input - Appointment data
   * @param userId - User ID for authorization
   * @returns Created appointment
   */
  async createAppointment(
    input: CreateAppointmentInput,
    userId?: string
  ): Promise<ServiceResult<Appointment>> {
    try {
      // Validate input
      const validatedData = createAppointmentSchema.parse(input)

      // TODO: Add authorization - verify user belongs to practice

      // Check for scheduling conflicts
      const hasConflict = await appointmentRepository.hasConflict(
        validatedData.practitioner_id,
        validatedData.start_time,
        validatedData.end_time
      )

      if (hasConflict) {
        return {
          success: false,
          error: 'This time slot conflicts with an existing appointment',
        }
      }

      // Create appointment
      const appointment = await appointmentRepository.createAppointment({
        practice_id: validatedData.practice_id,
        client_id: validatedData.client_id,
        practitioner_id: validatedData.practitioner_id,
        start_time: validatedData.start_time,
        end_time: validatedData.end_time,
        appointment_type: validatedData.appointment_type,
        status: validatedData.status || 'scheduled',
        notes: validatedData.notes || null,
      })

      return {
        success: true,
        data: appointment,
      }
    } catch (error) {
      if (error instanceof z.ZodError) {
        return {
          success: false,
          error: error.issues[0]?.message || 'Validation failed',
        }
      }

      console.error('Error creating appointment:', error)
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to create appointment',
      }
    }
  }

  /**
   * Update an appointment
   * @param id - Appointment ID
   * @param practiceId - Practice ID for authorization
   * @param input - Appointment data to update
   * @param userId - User ID for authorization
   * @returns Updated appointment
   */
  async updateAppointment(
    id: string,
    practiceId: string,
    input: UpdateAppointmentInput,
    userId?: string
  ): Promise<ServiceResult<Appointment>> {
    try {
      // Validate input
      const validatedData = updateAppointmentSchema.parse(input)

      // TODO: Add authorization - verify user belongs to practice

      // Check if appointment exists
      const existing = await appointmentRepository.findByIdAndPractice(id, practiceId)
      if (!existing) {
        return {
          success: false,
          error: 'Appointment not found',
        }
      }

      // Check for conflicts if time is being changed
      if (validatedData.start_time || validatedData.end_time) {
        const newStartTime = validatedData.start_time || existing.start_time
        const newEndTime = validatedData.end_time || existing.end_time

        const hasConflict = await appointmentRepository.hasConflict(
          existing.practitioner_id,
          newStartTime,
          newEndTime,
          id // Exclude current appointment
        )

        if (hasConflict) {
          return {
            success: false,
            error: 'This time slot conflicts with an existing appointment',
          }
        }
      }

      // Update appointment
      const appointment = await appointmentRepository.updateAppointment(id, validatedData)

      return {
        success: true,
        data: appointment,
      }
    } catch (error) {
      if (error instanceof z.ZodError) {
        return {
          success: false,
          error: error.issues[0]?.message || 'Validation failed',
        }
      }

      console.error('Error updating appointment:', error)
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to update appointment',
      }
    }
  }

  /**
   * Cancel an appointment
   * @param id - Appointment ID
   * @param practiceId - Practice ID for authorization
   * @param userId - User ID for authorization
   * @returns Updated appointment
   */
  async cancelAppointment(
    id: string,
    practiceId: string,
    userId?: string
  ): Promise<ServiceResult<Appointment>> {
    try {
      // TODO: Add authorization - verify user belongs to practice

      const existing = await appointmentRepository.findByIdAndPractice(id, practiceId)
      if (!existing) {
        return {
          success: false,
          error: 'Appointment not found',
        }
      }

      const appointment = await appointmentRepository.updateAppointment(id, {
        status: 'cancelled',
      })

      return {
        success: true,
        data: appointment,
      }
    } catch (error) {
      console.error('Error cancelling appointment:', error)
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to cancel appointment',
      }
    }
  }

  /**
   * Delete an appointment
   * @param id - Appointment ID
   * @param practiceId - Practice ID for authorization
   * @param userId - User ID for authorization
   * @returns Success status
   */
  async deleteAppointment(
    id: string,
    practiceId: string,
    userId?: string
  ): Promise<ServiceResult<boolean>> {
    try {
      // TODO: Add authorization - verify user belongs to practice and has admin rights

      const existing = await appointmentRepository.findByIdAndPractice(id, practiceId)
      if (!existing) {
        return {
          success: false,
          error: 'Appointment not found',
        }
      }

      await appointmentRepository.deleteAppointment(id)

      return {
        success: true,
        data: true,
      }
    } catch (error) {
      console.error('Error deleting appointment:', error)
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to delete appointment',
      }
    }
  }

  /**
   * Get appointment statistics for a practice
   * @param practiceId - Practice ID
   * @param userId - User ID for authorization
   * @returns Appointment statistics
   */
  async getAppointmentStats(
    practiceId: string,
    userId?: string
  ): Promise<ServiceResult<{
    total: number
    scheduled: number
    confirmed: number
    completed: number
    cancelled: number
    no_show: number
  }>> {
    try {
      // TODO: Add authorization - verify user belongs to practice

      const [total, scheduled, confirmed, completed, cancelled, no_show] = await Promise.all([
        appointmentRepository.countByPractice(practiceId),
        appointmentRepository.countByPractice(practiceId, 'scheduled'),
        appointmentRepository.countByPractice(practiceId, 'confirmed'),
        appointmentRepository.countByPractice(practiceId, 'completed'),
        appointmentRepository.countByPractice(practiceId, 'cancelled'),
        appointmentRepository.countByPractice(practiceId, 'no_show'),
      ])

      return {
        success: true,
        data: { total, scheduled, confirmed, completed, cancelled, no_show },
      }
    } catch (error) {
      console.error('Error fetching appointment stats:', error)
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to fetch appointment stats',
      }
    }
  }
}

// Export singleton instance
export const appointmentService = new AppointmentService()
