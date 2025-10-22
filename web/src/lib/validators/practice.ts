/**
 * Practice validation schemas
 *
 * Zod schemas for practice entity validation
 */

import { z } from 'zod'

/**
 * Create practice validation schema
 */
export const createPracticeSchema = z.object({
  name: z.string()
    .min(1, 'Practice name is required')
    .max(255, 'Practice name must be less than 255 characters'),
  description: z.string()
    .max(1000, 'Description must be less than 1000 characters')
    .nullable()
    .optional(),
})

/**
 * Update practice validation schema
 */
export const updatePracticeSchema = z.object({
  name: z.string()
    .min(1, 'Practice name is required')
    .max(255, 'Practice name must be less than 255 characters')
    .optional(),
  description: z.string()
    .max(1000, 'Description must be less than 1000 characters')
    .nullable()
    .optional(),
})

export type CreatePracticeInput = z.infer<typeof createPracticeSchema>
export type UpdatePracticeInput = z.infer<typeof updatePracticeSchema>
