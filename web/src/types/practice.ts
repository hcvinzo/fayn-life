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
 * Practice domain model
 */
export interface Practice {
  id: string
  name: string
  description: string | null
  createdAt: Date
  updatedAt: Date
}

/**
 * Create practice input
 */
export interface CreatePracticeInput {
  name: string
  description?: string | null
}

/**
 * Update practice input
 */
export interface UpdatePracticeInput {
  name?: string
  description?: string | null
}

/**
 * Practice filter options
 */
export interface PracticeFilters {
  search?: string
}
