/**
 * Repository layer for practitioner availability management
 * Feature #16: Database operations for schedule and exceptions
 */

import { createClient } from '@/lib/supabase/server'
import type {
  PractitionerAvailability,
  AvailabilityException,
  DayOfWeek,
} from '@/types/availability'
import type { AppointmentType } from '@/types/appointment'

// =====================================================
// PRACTITIONER AVAILABILITY REPOSITORY
// =====================================================

export class AvailabilityRepository {
  /**
   * Get all availability slots for a practitioner
   */
  async findByPractitioner(
    practitionerId: string
  ): Promise<PractitionerAvailability[]> {
    const supabase = await createClient()

    const { data, error } = await supabase
      .from('practitioner_availability')
      .select('*')
      .eq('practitioner_id', practitionerId)
      .eq('is_active', true)
      .order('day_of_week', { ascending: true })
      .order('appointment_type', { ascending: true })

    if (error) {
      throw new Error(`Failed to fetch availability: ${error.message}`)
    }

    return data || []
  }

  /**
   * Get availability for a specific day and appointment type
   */
  async findByDayAndType(
    practitionerId: string,
    dayOfWeek: DayOfWeek,
    appointmentType: AppointmentType
  ): Promise<PractitionerAvailability | null> {
    const supabase = await createClient()

    const { data, error } = await supabase
      .from('practitioner_availability')
      .select('*')
      .eq('practitioner_id', practitionerId)
      .eq('day_of_week', dayOfWeek)
      .eq('appointment_type', appointmentType)
      .eq('is_active', true)
      .single()

    if (error) {
      if (error.code === 'PGRST116') {
        // No rows found
        return null
      }
      throw new Error(`Failed to fetch availability: ${error.message}`)
    }

    return data
  }

  /**
   * Create a single availability slot
   */
  async create(
    practiceId: string,
    practitionerId: string,
    data: {
      day_of_week: DayOfWeek
      appointment_type: AppointmentType
      start_time: string
      end_time: string
      is_active?: boolean
    }
  ): Promise<PractitionerAvailability> {
    const supabase = await createClient()

    const { data: availability, error } = await supabase
      .from('practitioner_availability')
      .insert({
        practice_id: practiceId,
        practitioner_id: practitionerId,
        ...data,
      })
      .select()
      .single()

    if (error) {
      throw new Error(`Failed to create availability: ${error.message}`)
    }

    return availability
  }

  /**
   * Bulk create/update availability slots
   * Uses upsert to handle conflicts
   */
  async bulkUpsert(
    practiceId: string,
    practitionerId: string,
    slots: Array<{
      day_of_week: DayOfWeek
      appointment_type: AppointmentType
      start_time: string
      end_time: string
      is_active?: boolean
    }>
  ): Promise<PractitionerAvailability[]> {
    const supabase = await createClient()

    const records = slots.map((slot) => ({
      practice_id: practiceId,
      practitioner_id: practitionerId,
      ...slot,
    }))

    const { data, error } = await supabase
      .from('practitioner_availability')
      .upsert(records, {
        onConflict: 'practitioner_id,day_of_week,appointment_type',
      })
      .select()

    if (error) {
      throw new Error(`Failed to bulk upsert availability: ${error.message}`)
    }

    return data || []
  }

  /**
   * Update a single availability slot
   */
  async update(
    id: string,
    data: {
      start_time?: string
      end_time?: string
      is_active?: boolean
    }
  ): Promise<PractitionerAvailability> {
    const supabase = await createClient()

    const { data: availability, error } = await supabase
      .from('practitioner_availability')
      .update(data)
      .eq('id', id)
      .select()
      .single()

    if (error) {
      throw new Error(`Failed to update availability: ${error.message}`)
    }

    return availability
  }

  /**
   * Delete a single availability slot
   */
  async delete(id: string): Promise<void> {
    const supabase = await createClient()

    const { error } = await supabase
      .from('practitioner_availability')
      .delete()
      .eq('id', id)

    if (error) {
      throw new Error(`Failed to delete availability: ${error.message}`)
    }
  }

  /**
   * Soft delete (deactivate) availability slot
   */
  async deactivate(id: string): Promise<void> {
    const supabase = await createClient()

    const { error } = await supabase
      .from('practitioner_availability')
      .update({ is_active: false })
      .eq('id', id)

    if (error) {
      throw new Error(`Failed to deactivate availability: ${error.message}`)
    }
  }

  /**
   * Delete all availability for a practitioner (used for bulk reset)
   */
  async deleteAllForPractitioner(practitionerId: string): Promise<void> {
    const supabase = await createClient()

    const { error } = await supabase
      .from('practitioner_availability')
      .delete()
      .eq('practitioner_id', practitionerId)

    if (error) {
      throw new Error(`Failed to delete all availability: ${error.message}`)
    }
  }
}

// =====================================================
// AVAILABILITY EXCEPTIONS REPOSITORY
// =====================================================

export class AvailabilityExceptionRepository {
  /**
   * Get all exceptions for a practitioner
   */
  async findByPractitioner(
    practitionerId: string,
    activeOnly = true
  ): Promise<AvailabilityException[]> {
    const supabase = await createClient()

    let query = supabase
      .from('availability_exceptions')
      .select('*')
      .eq('practitioner_id', practitionerId)
      .order('start_datetime', { ascending: true })

    if (activeOnly) {
      query = query.eq('is_active', true)
    }

    const { data, error } = await query

    if (error) {
      throw new Error(`Failed to fetch exceptions: ${error.message}`)
    }

    return data || []
  }

  /**
   * Get exceptions that overlap with a specific datetime range
   */
  async findOverlapping(
    practitionerId: string,
    startDatetime: string,
    endDatetime: string
  ): Promise<AvailabilityException[]> {
    const supabase = await createClient()

    const { data, error } = await supabase
      .from('availability_exceptions')
      .select('*')
      .eq('practitioner_id', practitionerId)
      .eq('is_active', true)
      .lte('start_datetime', endDatetime)
      .gte('end_datetime', startDatetime)
      .order('start_datetime', { ascending: true })

    if (error) {
      throw new Error(`Failed to fetch overlapping exceptions: ${error.message}`)
    }

    return data || []
  }

  /**
   * Get a single exception by ID
   */
  async findById(id: string): Promise<AvailabilityException | null> {
    const supabase = await createClient()

    const { data, error } = await supabase
      .from('availability_exceptions')
      .select('*')
      .eq('id', id)
      .single()

    if (error) {
      if (error.code === 'PGRST116') {
        return null
      }
      throw new Error(`Failed to fetch exception: ${error.message}`)
    }

    return data
  }

  /**
   * Create an availability exception
   */
  async create(
    practiceId: string,
    practitionerId: string,
    data: {
      exception_type: 'time_off' | 'modified_hours' | 'type_only'
      start_datetime: string
      end_datetime: string
      modified_start_time?: string
      modified_end_time?: string
      allowed_appointment_types?: AppointmentType[]
      description?: string
    }
  ): Promise<AvailabilityException> {
    const supabase = await createClient()

    const { data: exception, error } = await supabase
      .from('availability_exceptions')
      .insert({
        practice_id: practiceId,
        practitioner_id: practitionerId,
        ...data,
      })
      .select()
      .single()

    if (error) {
      throw new Error(`Failed to create exception: ${error.message}`)
    }

    return exception
  }

  /**
   * Update an exception
   */
  async update(
    id: string,
    data: {
      start_datetime?: string
      end_datetime?: string
      modified_start_time?: string
      modified_end_time?: string
      allowed_appointment_types?: AppointmentType[]
      description?: string
      is_active?: boolean
    }
  ): Promise<AvailabilityException> {
    const supabase = await createClient()

    const { data: exception, error } = await supabase
      .from('availability_exceptions')
      .update(data)
      .eq('id', id)
      .select()
      .single()

    if (error) {
      throw new Error(`Failed to update exception: ${error.message}`)
    }

    return exception
  }

  /**
   * Delete an exception
   */
  async delete(id: string): Promise<void> {
    const supabase = await createClient()

    const { error } = await supabase
      .from('availability_exceptions')
      .delete()
      .eq('id', id)

    if (error) {
      throw new Error(`Failed to delete exception: ${error.message}`)
    }
  }

  /**
   * Soft delete (deactivate) an exception
   */
  async deactivate(id: string): Promise<void> {
    const supabase = await createClient()

    const { error } = await supabase
      .from('availability_exceptions')
      .update({ is_active: false })
      .eq('id', id)

    if (error) {
      throw new Error(`Failed to deactivate exception: ${error.message}`)
    }
  }
}

// =====================================================
// AVAILABILITY CHECK REPOSITORY
// =====================================================

export class AvailabilityCheckRepository {
  /**
   * Check if a practitioner is available at a specific time
   * Uses the database function is_practitioner_available
   */
  async checkAvailability(
    practitionerId: string,
    appointmentType: AppointmentType,
    startDatetime: string,
    endDatetime: string
  ): Promise<boolean> {
    const supabase = await createClient()

    const { data, error } = await supabase.rpc('is_practitioner_available', {
      p_practitioner_id: practitionerId,
      p_appointment_type: appointmentType,
      p_start_datetime: startDatetime,
      p_end_datetime: endDatetime,
    })

    if (error) {
      throw new Error(`Failed to check availability: ${error.message}`)
    }

    return data || false
  }
}

// =====================================================
// SINGLETON INSTANCES
// =====================================================

export const availabilityRepository = new AvailabilityRepository()
export const availabilityExceptionRepository = new AvailabilityExceptionRepository()
export const availabilityCheckRepository = new AvailabilityCheckRepository()
