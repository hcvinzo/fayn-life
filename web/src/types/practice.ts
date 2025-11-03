/**
 * Practice type definitions
 *
 * Domain types for practice entity
 */

import type { Database } from './database'

export type PracticeRow = Database['public']['Tables']['practices']['Row']
export type PracticeInsert = Database['public']['Tables']['practices']['Insert']
export type PracticeUpdate = Database['public']['Tables']['practices']['Update']

/**
 * Practice status enum
 */
export type PracticeStatus = 'active' | 'suspended' | 'inactive'

/**
 * Practice domain model
 */
export interface Practice {
  id: string
  name: string
  address: string | null
  phone: string | null
  email: string | null
  status: PracticeStatus
  created_at: string
  updated_at: string
}

/**
 * Create practice input
 */
export interface CreatePracticeInput {
  name: string
  address?: string | null
  phone?: string | null
  email?: string | null
  status?: PracticeStatus
}

/**
 * Update practice input
 */
export interface UpdatePracticeInput {
  name?: string
  address?: string | null
  phone?: string | null
  email?: string | null
  status?: PracticeStatus
}

/**
 * Practice filter options
 */
export interface PracticeFilters {
  search?: string
  status?: PracticeStatus | 'all'
}
