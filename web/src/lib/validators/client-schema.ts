/**
 * Client Validation Schemas
 *
 * Zod schemas for validating client-related inputs
 */

import { z } from 'zod'

/**
 * Schema for creating a new client
 */
export const createClientSchema = z.object({
  practice_id: z.string().uuid('Invalid practice ID format'),
  first_name: z
    .string()
    .min(2, 'First name must be at least 2 characters')
    .max(50, 'First name must be at most 50 characters'),
  last_name: z
    .string()
    .min(2, 'Last name must be at least 2 characters')
    .max(50, 'Last name must be at most 50 characters'),
  email: z
    .string()
    .email('Invalid email address')
    .optional()
    .nullable()
    .or(z.literal('')),
  phone: z
    .string()
    .regex(/^[+]?[(]?[0-9]{1,4}[)]?[-\s.]?[(]?[0-9]{1,4}[)]?[-\s.]?[0-9]{1,9}$/, 'Invalid phone number')
    .optional()
    .nullable()
    .or(z.literal('')),
  date_of_birth: z
    .string()
    .regex(/^\d{4}-\d{2}-\d{2}$/, 'Invalid date format. Use YYYY-MM-DD')
    .optional()
    .nullable()
    .or(z.literal('')),
  status: z.enum(['active', 'inactive', 'archived']).optional().default('active'),
  notes: z.string().max(1000, 'Notes must be at most 1000 characters').optional().nullable(),
})

/**
 * Schema for updating a client
 */
export const updateClientSchema = createClientSchema
  .omit({ practice_id: true })
  .partial()

/**
 * Type inference from schemas
 */
export type CreateClientInput = z.infer<typeof createClientSchema>
export type UpdateClientInput = z.infer<typeof updateClientSchema>
