/**
 * Client Domain Types
 *
 * Business domain types for Client entity
 */

import type { Database } from './database'

/**
 * Client entity type (mirrors database row)
 */
export type Client = Database['public']['Tables']['clients']['Row']

/**
 * Data required to create a new client
 */
export type CreateClientDto = {
  practice_id: string
  first_name: string
  last_name: string
  email?: string | null
  phone?: string | null
  date_of_birth?: string | null
  status?: 'active' | 'inactive' | 'archived'
  notes?: string | null
}

/**
 * Data allowed for client updates
 */
export type UpdateClientDto = Partial<Omit<CreateClientDto, 'practice_id'>>

/**
 * Client with computed fields (for UI)
 */
export interface ClientWithComputedFields extends Client {
  full_name: string // Computed from first_name + last_name
}

/**
 * Client list filters
 */
export interface ClientFilters {
  status?: 'active' | 'inactive' | 'archived'
  search?: string // Search by name or email
}
