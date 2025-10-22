/**
 * Appointment Validation Schemas
 *
 * Zod schemas for validating appointment-related inputs
 */

import { z } from 'zod'

/**
 * Schema for creating a new appointment
 */
export const createAppointmentSchema = z
  .object({
    practice_id: z.string().uuid('Invalid practice ID format'),
    client_id: z.string().uuid('Invalid client ID format'),
    practitioner_id: z.string().uuid('Invalid practitioner ID format'),
    start_time: z.string().datetime('Invalid start time format. Use ISO 8601 datetime'),
    end_time: z.string().datetime('Invalid end time format. Use ISO 8601 datetime'),
    status: z
      .enum(['scheduled', 'confirmed', 'completed', 'cancelled', 'no_show'])
      .optional()
      .default('scheduled'),
    notes: z.string().max(1000, 'Notes must be at most 1000 characters').optional().nullable(),
  })
  .refine(
    (data) => {
      // Ensure end_time is after start_time
      return new Date(data.end_time) > new Date(data.start_time)
    },
    {
      message: 'End time must be after start time',
      path: ['end_time'],
    }
  )

/**
 * Schema for updating an appointment
 */
export const updateAppointmentSchema = createAppointmentSchema
  .omit({ practice_id: true, practitioner_id: true })
  .partial()
  .refine(
    (data) => {
      // Only validate if both start_time and end_time are provided
      if (data.start_time && data.end_time) {
        return new Date(data.end_time) > new Date(data.start_time)
      }
      return true
    },
    {
      message: 'End time must be after start time',
      path: ['end_time'],
    }
  )

/**
 * Type inference from schemas
 */
export type CreateAppointmentInput = z.infer<typeof createAppointmentSchema>
export type UpdateAppointmentInput = z.infer<typeof updateAppointmentSchema>
