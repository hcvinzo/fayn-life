/**
 * Zod validation schemas for availability management
 * Feature #16: Working schedule and exception validation
 */

import { z } from 'zod'

// =====================================================
// CONSTANTS
// =====================================================

const TIME_REGEX = /^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/

// =====================================================
// BASE SCHEMAS
// =====================================================

export const dayOfWeekSchema = z
  .number()
  .int()
  .min(0)
  .max(6)
  .describe('Day of week: 0=Sunday, 1=Monday, ..., 6=Saturday')

export const appointmentTypeSchema = z.enum(['in_person', 'online'])

export const timeSchema = z
  .string()
  .regex(TIME_REGEX, 'Time must be in HH:MM format')
  .describe('Time in HH:MM format (24-hour)')

export const availabilityStatusSchema = z.enum(['off', 'online_only', 'in_person_only'])

// =====================================================
// AVAILABILITY SLOT SCHEMAS
// =====================================================

/**
 * Schema for a single availability slot
 */
export const availabilitySlotSchema = z
  .object({
    day_of_week: dayOfWeekSchema,
    appointment_type: appointmentTypeSchema,
    start_time: timeSchema,
    end_time: timeSchema,
    is_active: z.boolean().optional().default(true),
  })
  .refine((data) => data.end_time > data.start_time, {
    message: 'End time must be after start time',
    path: ['end_time'],
  })

/**
 * Schema for bulk setting availability
 */
export const bulkAvailabilitySchema = z
  .object({
    days: z
      .array(dayOfWeekSchema)
      .min(1, 'At least one day must be selected')
      .max(7, 'Cannot select more than 7 days'),
    appointment_type: appointmentTypeSchema,
    start_time: timeSchema,
    end_time: timeSchema,
  })
  .refine((data) => data.end_time > data.start_time, {
    message: 'End time must be after start time',
    path: ['end_time'],
  })

/**
 * Schema for updating a single availability record
 */
export const updateAvailabilitySchema = z
  .object({
    start_time: timeSchema.optional(),
    end_time: timeSchema.optional(),
    is_active: z.boolean().optional(),
  })
  .refine(
    (data) => {
      // If both times provided, end must be after start
      if (data.start_time && data.end_time) {
        return data.end_time > data.start_time
      }
      return true
    },
    {
      message: 'End time must be after start time',
      path: ['end_time'],
    }
  )

// =====================================================
// EXCEPTION SCHEMAS
// =====================================================

/**
 * Schema for creating an availability exception
 */
export const availabilityExceptionSchema = z
  .object({
    availability_status: availabilityStatusSchema,
    start_datetime: z.string().datetime({ message: 'Invalid datetime format' }),
    end_datetime: z.string().datetime({ message: 'Invalid datetime format' }),
    description: z.string().max(500).optional(),
  })
  .refine((data) => data.end_datetime > data.start_datetime, {
    message: 'End datetime must be after start datetime',
    path: ['end_datetime'],
  })

/**
 * Schema for updating an exception
 */
export const updateExceptionSchema = z
  .object({
    availability_status: availabilityStatusSchema.optional(),
    start_datetime: z.string().datetime().optional(),
    end_datetime: z.string().datetime().optional(),
    description: z.string().max(500).optional(),
    is_active: z.boolean().optional(),
  })
  .refine(
    (data) => {
      // If both datetimes provided, end must be after start
      if (data.start_datetime && data.end_datetime) {
        return data.end_datetime > data.start_datetime
      }
      return true
    },
    {
      message: 'End datetime must be after start datetime',
      path: ['end_datetime'],
    }
  )

// =====================================================
// AVAILABILITY CHECK SCHEMA
// =====================================================

/**
 * Schema for checking availability at a specific time
 */
export const availabilityCheckSchema = z
  .object({
    practitioner_id: z.string().uuid('Invalid practitioner ID'),
    appointment_type: appointmentTypeSchema,
    start_datetime: z.string().datetime({ message: 'Invalid start datetime' }),
    end_datetime: z.string().datetime({ message: 'Invalid end datetime' }),
  })
  .refine((data) => data.end_datetime > data.start_datetime, {
    message: 'End datetime must be after start datetime',
    path: ['end_datetime'],
  })

// =====================================================
// TYPE EXPORTS
// =====================================================

export type AvailabilitySlotInput = z.infer<typeof availabilitySlotSchema>
export type BulkAvailabilityInput = z.infer<typeof bulkAvailabilitySchema>
export type UpdateAvailabilityInput = z.infer<typeof updateAvailabilitySchema>
export type AvailabilityExceptionInput = z.infer<typeof availabilityExceptionSchema>
export type UpdateExceptionInput = z.infer<typeof updateExceptionSchema>
export type AvailabilityCheckInput = z.infer<typeof availabilityCheckSchema>
