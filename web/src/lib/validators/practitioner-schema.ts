/**
 * Practitioner Validation Schemas
 * Zod schemas for validating practitioner data
 */

import { z } from 'zod';

export const practitionerStatusSchema = z.enum(['active', 'suspended', 'blocked', 'pending']);
export const userRoleSchema = z.enum(['admin', 'practitioner', 'staff', 'assistant']);

export const createPractitionerSchema = z.object({
  email: z.string().email('Invalid email address'),
  full_name: z.string().min(2, 'Name must be at least 2 characters').max(100, 'Name must be at most 100 characters'),
  role: userRoleSchema,
  status: practitionerStatusSchema.optional().default('active'),
  practice_id: z.string().uuid('Invalid practice ID').nullable().optional(),
  password: z.string().min(6, 'Password must be at least 6 characters').optional(),
  confirm_password: z.string().optional(),
}).refine((data) => {
  // Only validate password match if password is provided
  if (data.password) {
    return data.password === data.confirm_password;
  }
  return true;
}, {
  message: 'Passwords must match',
  path: ['confirm_password'],
});

export const updatePractitionerSchema = z.object({
  full_name: z.string().min(2, 'Name must be at least 2 characters').max(100, 'Name must be at most 100 characters').optional(),
  role: userRoleSchema.optional(),
  status: practitionerStatusSchema.optional(),
  practice_id: z.string().uuid('Invalid practice ID').nullable().optional(),
});

export const practitionerFiltersSchema = z.object({
  search: z.string().optional(),
  status: z.union([practitionerStatusSchema, z.literal('all')]).optional(),
  role: z.union([userRoleSchema, z.literal('all')]).optional(),
  practice_id: z.string().uuid().optional(),
});

export type CreatePractitionerInput = z.infer<typeof createPractitionerSchema>;
export type UpdatePractitionerInput = z.infer<typeof updatePractitionerSchema>;
export type PractitionerFilters = z.infer<typeof practitionerFiltersSchema>;
