/**
 * Practice Repository
 *
 * Data access layer for practices.
 * Handles all database operations for the practices table.
 */

import { BaseRepository } from './base-repository'
import type { PracticeRow, PracticeInsert, PracticeUpdate } from '@/types/practice'
import { DatabaseError } from '@/lib/utils/errors'

export class PracticeRepository extends BaseRepository<'practices'> {
  constructor() {
    super('practices')
  }

  /**
   * Find practices with search filtering
   * @param search - Optional search string to filter by name
   * @returns Array of practices
   */
  async findAllWithSearch(search?: string): Promise<PracticeRow[]> {
    try {
      let query = this.db
        .from(this.tableName)
        .select('*')
        .order('name', { ascending: true })

      if (search && search.trim()) {
        query = query.ilike('name', `%${search.trim()}%`)
      }

      const { data, error } = await query

      if (error) {
        throw new DatabaseError(`Failed to search practices: ${error.message}`, error)
      }

      return (data as PracticeRow[]) || []
    } catch (error) {
      if (error instanceof DatabaseError) throw error
      throw new DatabaseError('Unexpected error searching practices', error)
    }
  }

  /**
   * Find practice by name (exact match)
   * @param name - Practice name
   * @returns Practice or null if not found
   */
  async findByName(name: string): Promise<PracticeRow | null> {
    return this.findOne({ name } as any)
  }

  /**
   * Get practices for public access (registration)
   * Returns only id and name fields
   * @returns Array of practices with id and name
   */
  async findPublic(): Promise<Array<{ id: string; name: string }>> {
    try {
      const { data, error } = await this.db
        .from(this.tableName)
        .select('id, name')
        .order('name', { ascending: true })

      if (error) {
        throw new DatabaseError(`Failed to fetch public practices: ${error.message}`, error)
      }

      return data || []
    } catch (error) {
      if (error instanceof DatabaseError) throw error
      throw new DatabaseError('Unexpected error fetching public practices', error)
    }
  }

  /**
   * Create a new practice
   * @param data - Practice data
   * @returns Created practice
   */
  async createPractice(data: PracticeInsert): Promise<PracticeRow> {
    return this.create(data)
  }

  /**
   * Update a practice
   * @param id - Practice ID
   * @param data - Practice data to update
   * @returns Updated practice
   */
  async updatePractice(id: string, data: PracticeUpdate): Promise<PracticeRow> {
    return this.update(id, data)
  }

  /**
   * Delete a practice
   * @param id - Practice ID
   * @returns True if deleted
   */
  async deletePractice(id: string): Promise<boolean> {
    return this.delete(id)
  }
}

// Export singleton instance
export const practiceRepository = new PracticeRepository()
