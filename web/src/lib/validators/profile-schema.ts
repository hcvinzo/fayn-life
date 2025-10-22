/**
 * Profile Validation Schemas
 *
 * Zod schemas for validating profile-related inputs
 */

import { z } from 'zod'

/**
 * Schema for creating a new profile
 */
export const createProfileSchema = z.object({
  id: z.string().uuid('Invalid user ID format'),
  email: z.string().email('Invalid email address'),
  full_name: z
    .string()
    .min(2, 'Full name must be at least 2 characters')
    .max(100, 'Full name must be at most 100 characters')
    .optional()
    .nullable(),
  role: z.enum(['admin', 'practitioner', 'staff']).optional().default('practitioner'),
  practice_id: z.string().uuid('Invalid practice ID format').optional().nullable(),
  avatar_url: z.string().url('Invalid avatar URL').optional().nullable(),
})

/**
 * Schema for updating a profile
 */
export const updateProfileSchema = z.object({
  full_name: z
    .string()
    .min(2, 'Full name must be at least 2 characters')
    .max(100, 'Full name must be at most 100 characters')
    .optional()
    .nullable(),
  avatar_url: z.string().url('Invalid avatar URL').optional().nullable(),
})

/**
 * Type inference from schemas
 */
export type CreateProfileInput = z.infer<typeof createProfileSchema>
export type UpdateProfileInput = z.infer<typeof updateProfileSchema>
