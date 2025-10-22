/**
 * Profile Domain Types
 *
 * Business domain types for Profile entity
 * These types are separate from database types and represent
 * the shape of data used in the application layer
 */

import type { Database } from './database'

/**
 * Profile entity type (mirrors database row)
 */
export type Profile = Database['public']['Tables']['profiles']['Row']

/**
 * Data required to create a new profile
 */
export type CreateProfileDto = {
  id: string // User ID from auth
  email: string
  full_name?: string | null
  role?: 'admin' | 'practitioner' | 'staff'
  practice_id?: string | null
  avatar_url?: string | null
}

/**
 * Data allowed for profile updates
 */
export type UpdateProfileDto = {
  full_name?: string | null
  avatar_url?: string | null
  // Note: email, role, and practice_id typically shouldn't be updated by users
  // These would require admin privileges or special workflows
}

/**
 * Profile with related data (for future use)
 */
export interface ProfileWithRelations extends Profile {
  // We can add related data here when needed, e.g.:
  // practice?: Practice
}
