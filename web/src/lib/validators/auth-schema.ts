/**
 * Authentication Validation Schemas
 *
 * Zod schemas for validating authentication-related data.
 * Following the validation pattern established in the codebase.
 */

import { z } from 'zod'

/**
 * Sign in schema
 */
export const signInSchema = z.object({
  email: z
    .string()
    .min(1, 'Email is required')
    .email('Invalid email address'),
  password: z
    .string()
    .min(1, 'Password is required'),
})

export type SignInInput = z.infer<typeof signInSchema>

/**
 * Sign up schema
 *
 * Security Note: Password validation uses generic error messages to avoid
 * exposing password policy to potential attackers. Actual requirements:
 * - Minimum 8 characters
 * - At least one uppercase letter
 * - At least one lowercase letter
 * - At least one digit
 */
export const signUpSchema = z.object({
  email: z
    .string()
    .min(1, 'Email is required')
    .email('Invalid email address'),
  password: z
    .string()
    .min(1, 'Password is required')
    .min(8, 'Password does not meet security requirements')
    .regex(
      /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/,
      'Password does not meet security requirements'
    ),
  confirmPassword: z.string().min(1, 'Please confirm your password'),
  fullName: z
    .string()
    .min(1, 'Full name is required')
    .min(2, 'Full name must be at least 2 characters')
    .max(100, 'Full name must be less than 100 characters'),
  practiceId: z.string().uuid().optional().nullable(),
  role: z.enum(['admin', 'practitioner', 'staff']).optional(),
}).refine((data) => data.password === data.confirmPassword, {
  message: 'Passwords do not match',
  path: ['confirmPassword'],
})

export type SignUpInput = z.infer<typeof signUpSchema>

/**
 * Reset password schema
 */
export const resetPasswordSchema = z.object({
  email: z
    .string()
    .min(1, 'Email is required')
    .email('Invalid email address'),
})

export type ResetPasswordInput = z.infer<typeof resetPasswordSchema>

/**
 * Update password schema
 *
 * Security Note: Password validation uses generic error messages to avoid
 * exposing password policy to potential attackers.
 */
export const updatePasswordSchema = z.object({
  currentPassword: z
    .string()
    .min(1, 'Current password is required'),
  newPassword: z
    .string()
    .min(1, 'New password is required')
    .min(8, 'Password does not meet security requirements')
    .regex(
      /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/,
      'Password does not meet security requirements'
    ),
  confirmPassword: z.string().min(1, 'Please confirm your password'),
}).refine((data) => data.newPassword === data.confirmPassword, {
  message: 'Passwords do not match',
  path: ['confirmPassword'],
})

export type UpdatePasswordInput = z.infer<typeof updatePasswordSchema>
