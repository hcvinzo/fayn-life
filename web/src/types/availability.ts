/**
 * Types for Practitioner Availability Management
 * Feature #16: Working schedule, hours, and exception management
 */

import { AppointmentType } from './appointment'

// =====================================================
// ENUMS
// =====================================================

/**
 * Availability status for exceptions
 */
export type AvailabilityStatus = 'off' | 'online_only' | 'in_person_only'

/**
 * Day of week (0 = Sunday, 1 = Monday, ..., 6 = Saturday)
 */
export type DayOfWeek = 0 | 1 | 2 | 3 | 4 | 5 | 6

// =====================================================
// DATABASE MODELS
// =====================================================

/**
 * Practitioner regular weekly availability
 * Defines working hours for each day and appointment type
 */
export interface PractitionerAvailability {
  id: string
  practice_id: string
  practitioner_id: string
  day_of_week: DayOfWeek
  appointment_type: AppointmentType
  start_time: string // HH:MM:SS format
  end_time: string // HH:MM:SS format
  is_active: boolean
  created_at: string
  updated_at: string
}

/**
 * Availability exception (off, online only, in-person only)
 */
export interface AvailabilityException {
  id: string
  practice_id: string
  practitioner_id: string
  availability_status: AvailabilityStatus
  start_datetime: string // ISO 8601
  end_datetime: string // ISO 8601
  description?: string | null
  is_active: boolean
  created_at: string
  updated_at: string
}

// =====================================================
// INPUT TYPES (for forms and API)
// =====================================================

/**
 * Input for creating/updating a single availability slot
 */
export interface AvailabilitySlotInput {
  day_of_week: DayOfWeek
  appointment_type: AppointmentType
  start_time: string // HH:MM format
  end_time: string // HH:MM format
  is_active?: boolean
}

/**
 * Input for bulk setting availability
 * Used when user sets hours for multiple days at once
 */
export interface BulkAvailabilityInput {
  days: DayOfWeek[] // e.g., [1,2,3,4,5] for Mon-Fri
  appointment_type: AppointmentType
  start_time: string // HH:MM format
  end_time: string // HH:MM format
}

/**
 * Input for creating an availability exception
 */
export interface AvailabilityExceptionInput {
  availability_status: AvailabilityStatus
  start_datetime: string // ISO 8601
  end_datetime: string // ISO 8601
  description?: string
}

// =====================================================
// VIEW MODELS (for display)
// =====================================================

/**
 * Availability grouped by day for easier display
 */
export interface DayAvailability {
  day_of_week: DayOfWeek
  day_name: string // e.g., "Monday"
  slots: {
    appointment_type: AppointmentType
    start_time: string
    end_time: string
    is_active: boolean
  }[]
}

/**
 * Complete availability overview for a practitioner
 */
export interface AvailabilityOverview {
  practitioner_id: string
  regular_schedule: DayAvailability[]
  exceptions: AvailabilityException[]
}

/**
 * Time slot availability check result
 */
export interface AvailabilityCheckResult {
  available: boolean
  reason?: string // e.g., "Outside working hours", "Time off", etc.
}

// =====================================================
// CONSTANTS & HELPERS
// =====================================================

/**
 * Day names for display
 */
export const DAY_NAMES: Record<DayOfWeek, string> = {
  0: 'Sunday',
  1: 'Monday',
  2: 'Tuesday',
  3: 'Wednesday',
  4: 'Thursday',
  5: 'Friday',
  6: 'Saturday',
}

/**
 * Short day names for compact display
 */
export const DAY_NAMES_SHORT: Record<DayOfWeek, string> = {
  0: 'Sun',
  1: 'Mon',
  2: 'Tue',
  3: 'Wed',
  4: 'Thu',
  5: 'Fri',
  6: 'Sat',
}

/**
 * Availability status labels for display
 */
export const AVAILABILITY_STATUS_LABELS: Record<AvailabilityStatus, string> = {
  off: 'Off (Unavailable)',
  online_only: 'Online Only',
  in_person_only: 'In-Person Only',
}

/**
 * Helper to get day of week from Date object
 */
export function getDayOfWeek(date: Date): DayOfWeek {
  return date.getDay() as DayOfWeek
}

/**
 * Helper to format time from HH:MM:SS to HH:MM
 */
export function formatTimeShort(time: string): string {
  return time.substring(0, 5)
}

/**
 * Helper to check if a day is a weekday (Mon-Fri)
 */
export function isWeekday(day: DayOfWeek): boolean {
  return day >= 1 && day <= 5
}

/**
 * Helper to get all weekdays
 */
export function getWeekdays(): DayOfWeek[] {
  return [1, 2, 3, 4, 5]
}

/**
 * Helper to get all weekend days
 */
export function getWeekendDays(): DayOfWeek[] {
  return [0, 6]
}
