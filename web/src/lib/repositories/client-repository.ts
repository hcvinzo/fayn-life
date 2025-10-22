/**
 * Client Repository
 *
 * Data access layer for clients.
 * Handles all database operations for the clients table.
 */

import { BaseRepository } from './base-repository'
import type { Client, ClientFilters } from '@/types/client'
import type { Database } from '@/types/database'
import { DatabaseError } from '@/lib/utils/errors'

type ClientRow = Database['public']['Tables']['clients']['Row']
type ClientInsert = Database['public']['Tables']['clients']['Insert']
type ClientUpdate = Database['public']['Tables']['clients']['Update']

export class ClientRepository extends BaseRepository<'clients'> {
  constructor() {
    super('clients')
  }

  /**
   * Find all clients for a practice with optional filtering
   * @param practiceId - Practice ID to filter by
   * @param filters - Optional filters (status, search)
   * @returns Array of clients
   */
  async findByPractice(practiceId: string, filters?: ClientFilters): Promise<ClientRow[]> {
    try {
      let query = this.db
        .from(this.tableName)
        .select('*')
        .eq('practice_id', practiceId)
        .order('last_name', { ascending: true })
        .order('first_name', { ascending: true })

      // Apply status filter
      if (filters?.status) {
        query = query.eq('status', filters.status)
      }

      // Apply search filter
      if (filters?.search && filters.search.trim()) {
        const searchTerm = filters.search.trim().toLowerCase()
        query = query.or(
          `first_name.ilike.%${searchTerm}%,last_name.ilike.%${searchTerm}%,email.ilike.%${searchTerm}%`
        )
      }

      const { data, error } = await query

      if (error) {
        throw new DatabaseError(`Failed to fetch clients: ${error.message}`, error)
      }

      return (data as ClientRow[]) || []
    } catch (error) {
      if (error instanceof DatabaseError) throw error
      throw new DatabaseError('Unexpected error fetching clients', error)
    }
  }

  /**
   * Find client by ID (with practice_id check for RLS)
   * @param id - Client ID
   * @param practiceId - Practice ID for authorization
   * @returns Client or null
   */
  async findByIdAndPractice(id: string, practiceId: string): Promise<ClientRow | null> {
    return this.findOne({ id, practice_id: practiceId } as any)
  }

  /**
   * Find client by email in a practice
   * @param email - Client email
   * @param practiceId - Practice ID
   * @returns Client or null
   */
  async findByEmail(email: string, practiceId: string): Promise<ClientRow | null> {
    return this.findOne({ email, practice_id: practiceId } as any)
  }

  /**
   * Count clients by status for a practice
   * @param practiceId - Practice ID
   * @param status - Optional status filter
   * @returns Count of clients
   */
  async countByPractice(practiceId: string, status?: 'active' | 'inactive' | 'archived'): Promise<number> {
    const filters: any = { practice_id: practiceId }
    if (status) {
      filters.status = status
    }
    return this.count(filters)
  }

  /**
   * Create a new client
   * @param data - Client data
   * @returns Created client
   */
  async createClient(data: ClientInsert): Promise<ClientRow> {
    return this.create(data)
  }

  /**
   * Update a client
   * @param id - Client ID
   * @param data - Client data to update
   * @returns Updated client
   */
  async updateClient(id: string, data: ClientUpdate): Promise<ClientRow> {
    return this.update(id, data)
  }

  /**
   * Delete a client (soft delete by setting status to archived)
   * @param id - Client ID
   * @returns Updated client
   */
  async archiveClient(id: string): Promise<ClientRow> {
    return this.update(id, { status: 'archived' } as any)
  }

  /**
   * Hard delete a client
   * @param id - Client ID
   * @returns True if deleted
   */
  async deleteClient(id: string): Promise<boolean> {
    return this.delete(id)
  }
}

// Export singleton instance
export const clientRepository = new ClientRepository()
