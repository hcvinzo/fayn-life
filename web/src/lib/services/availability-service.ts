/**
 * Service layer for practitioner availability management
 * Feature #16: Business logic for schedule and exception management
 */

import {
  availabilityRepository,
  availabilityExceptionRepository,
  availabilityCheckRepository,
} from '@/lib/repositories/availability-repository'
import {
  availabilitySlotSchema,
  bulkAvailabilitySchema,
  updateAvailabilitySchema,
  availabilityExceptionSchema,
  updateExceptionSchema,
  availabilityCheckSchema,
  type AvailabilitySlotInput,
  type BulkAvailabilityInput,
  type UpdateAvailabilityInput,
  type AvailabilityExceptionInput,
  type UpdateExceptionInput,
  type AvailabilityCheckInput,
} from '@/lib/validators/availability-schema'
import type {
  PractitionerAvailability,
  AvailabilityException,
  AvailabilityOverview,
  DayAvailability,
  AvailabilityCheckResult,
  DayOfWeek,
} from '@/types/availability'
import type { AppointmentType } from '@/types/appointment'
import { DAY_NAMES, formatTimeShort } from '@/types/availability'

// =====================================================
// AVAILABILITY SERVICE
// =====================================================

export class AvailabilityService {
  /**
   * Get complete availability overview for a practitioner
   */
  async getAvailabilityOverview(
    practitionerId: string
  ): Promise<AvailabilityOverview> {
    // Fetch regular schedule and exceptions in parallel
    const [regularSchedule, exceptions] = await Promise.all([
      availabilityRepository.findByPractitioner(practitionerId),
      availabilityExceptionRepository.findByPractitioner(practitionerId),
    ])

    // Group regular schedule by day
    const groupedByDay = this.groupByDay(regularSchedule)

    return {
      practitioner_id: practitionerId,
      regular_schedule: groupedByDay,
      exceptions,
    }
  }

  /**
   * Get regular schedule for a practitioner
   */
  async getRegularSchedule(
    practitionerId: string
  ): Promise<PractitionerAvailability[]> {
    return availabilityRepository.findByPractitioner(practitionerId)
  }

  /**
   * Create a single availability slot
   */
  async createAvailabilitySlot(
    practiceId: string,
    practitionerId: string,
    input: AvailabilitySlotInput
  ): Promise<PractitionerAvailability> {
    // Validate input
    const validated = availabilitySlotSchema.parse(input)

    // Convert HH:MM to HH:MM:SS
    const start_time = `${validated.start_time}:00`
    const end_time = `${validated.end_time}:00`

    return availabilityRepository.create(practiceId, practitionerId, {
      day_of_week: validated.day_of_week,
      appointment_type: validated.appointment_type,
      start_time,
      end_time,
      is_active: validated.is_active ?? true,
    })
  }

  /**
   * Bulk set availability for multiple days
   * This is the primary way users set their schedule
   */
  async setBulkAvailability(
    practiceId: string,
    practitionerId: string,
    input: BulkAvailabilityInput
  ): Promise<PractitionerAvailability[]> {
    // Validate input
    const validated = bulkAvailabilitySchema.parse(input)

    // Convert HH:MM to HH:MM:SS
    const start_time = `${validated.start_time}:00`
    const end_time = `${validated.end_time}:00`

    // Create slots for each selected day
    const slots = validated.days.map((day) => ({
      day_of_week: day,
      appointment_type: validated.appointment_type,
      start_time,
      end_time,
      is_active: true,
    }))

    return availabilityRepository.bulkUpsert(
      practiceId,
      practitionerId,
      slots
    )
  }

  /**
   * Update a single availability slot
   */
  async updateAvailabilitySlot(
    id: string,
    input: UpdateAvailabilityInput
  ): Promise<PractitionerAvailability> {
    // Validate input
    const validated = updateAvailabilitySchema.parse(input)

    // Convert times if provided
    const updateData: any = {}
    if (validated.start_time) {
      updateData.start_time = `${validated.start_time}:00`
    }
    if (validated.end_time) {
      updateData.end_time = `${validated.end_time}:00`
    }
    if (validated.is_active !== undefined) {
      updateData.is_active = validated.is_active
    }

    return availabilityRepository.update(id, updateData)
  }

  /**
   * Delete availability slot
   */
  async deleteAvailabilitySlot(id: string): Promise<void> {
    return availabilityRepository.delete(id)
  }

  /**
   * Reset all availability for a practitioner and set defaults
   * Default: Mon-Fri, 9 AM - 5 PM for both appointment types
   */
  async resetToDefaults(
    practiceId: string,
    practitionerId: string
  ): Promise<PractitionerAvailability[]> {
    // Delete all existing availability
    await availabilityRepository.deleteAllForPractitioner(practitionerId)

    // Create default slots
    const slots: Array<{
      day_of_week: DayOfWeek
      appointment_type: AppointmentType
      start_time: string
      end_time: string
      is_active: boolean
    }> = []

    // Mon-Fri (1-5)
    for (let day = 1; day <= 5; day++) {
      slots.push({
        day_of_week: day as DayOfWeek,
        appointment_type: 'in_person',
        start_time: '09:00:00',
        end_time: '17:00:00',
        is_active: true,
      })
      slots.push({
        day_of_week: day as DayOfWeek,
        appointment_type: 'online',
        start_time: '09:00:00',
        end_time: '17:00:00',
        is_active: true,
      })
    }

    return availabilityRepository.bulkUpsert(
      practiceId,
      practitionerId,
      slots
    )
  }

  /**
   * Group availability slots by day for easier display
   */
  private groupByDay(slots: PractitionerAvailability[]): DayAvailability[] {
    const grouped = new Map<DayOfWeek, DayAvailability>()

    slots.forEach((slot) => {
      if (!grouped.has(slot.day_of_week)) {
        grouped.set(slot.day_of_week, {
          day_of_week: slot.day_of_week,
          day_name: DAY_NAMES[slot.day_of_week],
          slots: [],
        })
      }

      grouped.get(slot.day_of_week)!.slots.push({
        appointment_type: slot.appointment_type,
        start_time: formatTimeShort(slot.start_time),
        end_time: formatTimeShort(slot.end_time),
        is_active: slot.is_active,
      })
    })

    // Convert to array and sort by day
    return Array.from(grouped.values()).sort(
      (a, b) => a.day_of_week - b.day_of_week
    )
  }
}

// =====================================================
// EXCEPTION SERVICE
// =====================================================

export class AvailabilityExceptionService {
  /**
   * Get all exceptions for a practitioner
   */
  async getExceptions(
    practitionerId: string,
    activeOnly = true
  ): Promise<AvailabilityException[]> {
    return availabilityExceptionRepository.findByPractitioner(
      practitionerId,
      activeOnly
    )
  }

  /**
   * Get a single exception by ID
   */
  async getExceptionById(id: string): Promise<AvailabilityException | null> {
    return availabilityExceptionRepository.findById(id)
  }

  /**
   * Create an availability exception
   */
  async createException(
    practiceId: string,
    practitionerId: string,
    input: AvailabilityExceptionInput
  ): Promise<AvailabilityException> {
    // Validate input
    const validated = availabilityExceptionSchema.parse(input)

    // Create exception data
    const createData = {
      availability_status: validated.availability_status,
      start_datetime: validated.start_datetime,
      end_datetime: validated.end_datetime,
      description: validated.description,
    }

    return availabilityExceptionRepository.create(
      practiceId,
      practitionerId,
      createData
    )
  }

  /**
   * Update an exception
   */
  async updateException(
    id: string,
    input: UpdateExceptionInput
  ): Promise<AvailabilityException> {
    // Validate input
    const validated = updateExceptionSchema.parse(input)

    // Build update data
    const updateData: any = {}
    if (validated.availability_status) {
      updateData.availability_status = validated.availability_status
    }
    if (validated.start_datetime) {
      updateData.start_datetime = validated.start_datetime
    }
    if (validated.end_datetime) {
      updateData.end_datetime = validated.end_datetime
    }
    if (validated.description !== undefined) {
      updateData.description = validated.description
    }
    if (validated.is_active !== undefined) {
      updateData.is_active = validated.is_active
    }

    return availabilityExceptionRepository.update(id, updateData)
  }

  /**
   * Delete an exception
   */
  async deleteException(id: string): Promise<void> {
    return availabilityExceptionRepository.delete(id)
  }
}

// =====================================================
// AVAILABILITY CHECK SERVICE
// =====================================================

export class AvailabilityCheckService {
  /**
   * Check if a practitioner is available for a specific appointment
   * Returns detailed result with availability status and reason
   */
  async checkAvailability(
    input: AvailabilityCheckInput
  ): Promise<AvailabilityCheckResult> {
    // Validate input
    const validated = availabilityCheckSchema.parse(input)

    try {
      // Use the database function to check availability
      const available = await availabilityCheckRepository.checkAvailability(
        validated.practitioner_id,
        validated.appointment_type,
        validated.start_datetime,
        validated.end_datetime
      )

      if (available) {
        return { available: true }
      }

      // If not available, try to determine the reason
      const reason = await this.determineUnavailabilityReason(
        validated.practitioner_id,
        validated.appointment_type,
        validated.start_datetime,
        validated.end_datetime
      )

      return {
        available: false,
        reason,
      }
    } catch (error) {
      throw new Error(
        `Failed to check availability: ${error instanceof Error ? error.message : 'Unknown error'}`
      )
    }
  }

  /**
   * Determine why a practitioner is unavailable
   */
  private async determineUnavailabilityReason(
    practitionerId: string,
    appointmentType: AppointmentType,
    startDatetime: string,
    endDatetime: string
  ): Promise<string> {
    // Check for exceptions in the requested time period
    const exceptions =
      await availabilityExceptionRepository.findOverlapping(
        practitionerId,
        startDatetime,
        endDatetime
      )

    // Check for availability status exceptions
    for (const exception of exceptions) {
      if (exception.availability_status === 'off') {
        return exception.description || 'Practitioner is unavailable during this period'
      }

      if (exception.availability_status === 'online_only' && appointmentType !== 'online') {
        return exception.description || 'Only online appointments available during this period'
      }

      if (exception.availability_status === 'in_person_only' && appointmentType !== 'in_person') {
        return exception.description || 'Only in-person appointments available during this period'
      }
    }

    // Default reason
    return 'Outside of regular working hours'
  }
}

// =====================================================
// SINGLETON INSTANCES
// =====================================================

export const availabilityService = new AvailabilityService()
export const availabilityExceptionService = new AvailabilityExceptionService()
export const availabilityCheckService = new AvailabilityCheckService()
