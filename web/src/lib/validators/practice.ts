/**
 * Practice validation schemas
 *
 * Zod schemas for practice entity validation
 */

import { z } from 'zod'

/**
 * Practice status enum schema
 */
export const practiceStatusSchema = z.enum(['active', 'suspended', 'inactive'])

/**
 * Practice filters schema
 */
export const practiceFiltersSchema = z.object({
  search: z.string().optional(),
  status: z.union([practiceStatusSchema, z.literal('all')]).optional(),
})

/**
 * Create practice validation schema
 */
export const createPracticeSchema = z.object({
  name: z.string()
    .min(2, 'Practice name must be at least 2 characters')
    .max(255, 'Practice name must be less than 255 characters'),
  address: z.string()
    .max(500, 'Address must be less than 500 characters')
    .nullable()
    .optional(),
  phone: z.string()
    .max(50, 'Phone must be less than 50 characters')
    .nullable()
    .optional(),
  email: z.string()
    .email('Invalid email address')
    .nullable()
    .optional(),
  status: practiceStatusSchema.optional(),
})

/**
 * Update practice validation schema
 */
export const updatePracticeSchema = z.object({
  name: z.string()
    .min(2, 'Practice name must be at least 2 characters')
    .max(255, 'Practice name must be less than 255 characters')
    .optional(),
  address: z.string()
    .max(500, 'Address must be less than 500 characters')
    .nullable()
    .optional(),
  phone: z.string()
    .max(50, 'Phone must be less than 50 characters')
    .nullable()
    .optional(),
  email: z.string()
    .email('Invalid email address')
    .nullable()
    .optional(),
  status: practiceStatusSchema.optional(),
})

export type PracticeStatus = z.infer<typeof practiceStatusSchema>
export type PracticeFilters = z.infer<typeof practiceFiltersSchema>
export type CreatePracticeInput = z.infer<typeof createPracticeSchema>
export type UpdatePracticeInput = z.infer<typeof updatePracticeSchema>
