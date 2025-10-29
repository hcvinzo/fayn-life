/**
 * API Client for availability management
 * Feature #16: Frontend HTTP client for schedule and exception operations
 */

import { apiClient } from './client'
import type {
  PractitionerAvailability,
  AvailabilityException,
  AvailabilityCheckResult,
  BulkAvailabilityInput,
  AvailabilitySlotInput,
  AvailabilityExceptionInput,
} from '@/types/availability'
import type { AppointmentType } from '@/types/appointment'

// =====================================================
// AVAILABILITY API
// =====================================================

export const availabilityApi = {
  /**
   * Get practitioner's regular schedule
   */
  async getSchedule(): Promise<PractitionerAvailability[]> {
    return apiClient.get<PractitionerAvailability[]>('/availability')
  },

  /**
   * Create a single availability slot
   */
  async createSlot(data: AvailabilitySlotInput): Promise<PractitionerAvailability> {
    return apiClient.post<PractitionerAvailability>('/availability', data)
  },

  /**
   * Bulk set availability for multiple days
   */
  async setBulk(data: BulkAvailabilityInput): Promise<PractitionerAvailability[]> {
    return apiClient.post<PractitionerAvailability[]>('/availability', data)
  },

  /**
   * Update an availability slot
   */
  async updateSlot(
    id: string,
    data: { start_time?: string; end_time?: string; is_active?: boolean }
  ): Promise<PractitionerAvailability> {
    return apiClient.patch<PractitionerAvailability>(`/availability/${id}`, data)
  },

  /**
   * Delete an availability slot
   */
  async deleteSlot(id: string): Promise<void> {
    await apiClient.delete(`/availability/${id}`)
  },

  /**
   * Reset schedule to defaults (Mon-Fri, 9-5)
   */
  async resetToDefaults(): Promise<PractitionerAvailability[]> {
    return apiClient.post<PractitionerAvailability[]>('/availability/reset', {})
  },
}

// =====================================================
// EXCEPTION API
// =====================================================

export const exceptionApi = {
  /**
   * Get all exceptions for the practitioner
   */
  async getAll(activeOnly = true): Promise<AvailabilityException[]> {
    const params = new URLSearchParams()
    params.set('activeOnly', activeOnly.toString())
    return apiClient.get<AvailabilityException[]>(
      `/availability/exceptions?${params.toString()}`
    )
  },

  /**
   * Get a single exception by ID
   */
  async getById(id: string): Promise<AvailabilityException> {
    return apiClient.get<AvailabilityException>(`/availability/exceptions/${id}`)
  },

  /**
   * Create a new exception
   */
  async create(data: AvailabilityExceptionInput): Promise<AvailabilityException> {
    return apiClient.post<AvailabilityException>('/availability/exceptions', data)
  },

  /**
   * Update an exception
   */
  async update(
    id: string,
    data: Partial<AvailabilityExceptionInput>
  ): Promise<AvailabilityException> {
    return apiClient.patch<AvailabilityException>(
      `/availability/exceptions/${id}`,
      data
    )
  },

  /**
   * Delete an exception
   */
  async delete(id: string): Promise<void> {
    await apiClient.delete(`/availability/exceptions/${id}`)
  },
}

// =====================================================
// AVAILABILITY CHECK API
// =====================================================

export const availabilityCheckApi = {
  /**
   * Check if a practitioner is available for a specific time slot
   */
  async check(data: {
    practitioner_id?: string
    appointment_type: AppointmentType
    start_datetime: string
    end_datetime: string
  }): Promise<AvailabilityCheckResult> {
    return apiClient.post<AvailabilityCheckResult>('/availability/check', data)
  },
}
