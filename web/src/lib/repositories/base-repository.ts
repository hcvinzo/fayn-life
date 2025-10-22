/**
 * Base Repository
 *
 * Abstract base class providing common CRUD operations for all repositories.
 * Specific repositories extend this class and add entity-specific methods.
 */

import { getDbClient, type TableName, type TableRow, type TableInsert, type TableUpdate } from '@/lib/db/client'
import { DatabaseError, NotFoundError } from '@/lib/utils/errors'

export abstract class BaseRepository<T extends TableName> {
  protected db = getDbClient()

  constructor(protected tableName: T) {}

  /**
   * Find all records in the table
   * @param filters - Optional filters to apply
   * @returns Array of records
   */
  async findAll(filters?: Partial<TableRow<T>>): Promise<TableRow<T>[]> {
    try {
      let query = this.db.from(this.tableName).select('*')

      // Apply filters if provided
      if (filters) {
        Object.entries(filters).forEach(([key, value]) => {
          if (value !== undefined && value !== null) {
            query = query.eq(key, value)
          }
        })
      }

      const { data, error } = await query

      if (error) {
        throw new DatabaseError(`Failed to fetch ${this.tableName}: ${error.message}`, error)
      }

      return (data as unknown as TableRow<T>[]) || []
    } catch (error) {
      if (error instanceof DatabaseError) throw error
      throw new DatabaseError(`Unexpected error fetching ${this.tableName}`, error)
    }
  }

  /**
   * Find a single record by ID
   * @param id - Record ID
   * @returns Record or null if not found
   */
  async findById(id: string): Promise<TableRow<T> | null> {
    try {
      const { data, error } = (await this.db
        .from(this.tableName)
        .select('*')
        .eq('id' as any, id as any)
        .single()) as any

      if (error) {
        // Supabase returns PGRST116 for no rows found
        if (error.code === 'PGRST116') {
          return null
        }
        throw new DatabaseError(`Failed to fetch ${this.tableName} by ID: ${error.message}`, error)
      }

      return data as unknown as TableRow<T>
    } catch (error) {
      if (error instanceof DatabaseError) throw error
      throw new DatabaseError(`Unexpected error fetching ${this.tableName} by ID`, error)
    }
  }

  /**
   * Find a single record by filters
   * @param filters - Filters to apply
   * @returns Record or null if not found
   */
  async findOne(filters: Partial<TableRow<T>>): Promise<TableRow<T> | null> {
    try {
      let query = this.db.from(this.tableName).select('*')

      Object.entries(filters).forEach(([key, value]) => {
        if (value !== undefined && value !== null) {
          query = query.eq(key, value)
        }
      })

      const { data, error } = await query.single()

      if (error) {
        if (error.code === 'PGRST116') {
          return null
        }
        throw new DatabaseError(`Failed to fetch ${this.tableName}: ${error.message}`, error)
      }

      return data as unknown as TableRow<T>
    } catch (error) {
      if (error instanceof DatabaseError) throw error
      throw new DatabaseError(`Unexpected error fetching ${this.tableName}`, error)
    }
  }

  /**
   * Create a new record
   * @param data - Data to insert
   * @returns Created record
   */
  async create(data: TableInsert<T>): Promise<TableRow<T>> {
    try {
      const { data: created, error } = await this.db
        .from(this.tableName)
        .insert(data as any)
        .select()
        .single()

      if (error) {
        throw new DatabaseError(`Failed to create ${this.tableName}: ${error.message}`, error)
      }

      return created as unknown as TableRow<T>
    } catch (error) {
      if (error instanceof DatabaseError) throw error
      throw new DatabaseError(`Unexpected error creating ${this.tableName}`, error)
    }
  }

  /**
   * Update a record by ID
   * @param id - Record ID
   * @param data - Data to update
   * @returns Updated record
   */
  async update(id: string, data: TableUpdate<T>): Promise<TableRow<T>> {
    try {
      const { data: updated, error } = (await this.db
        .from(this.tableName)
        .update(data as any)
        .eq('id' as any, id as any)
        .select()
        .single()) as any

      if (error) {
        if (error.code === 'PGRST116') {
          throw new NotFoundError(`${this.tableName} with ID ${id} not found`)
        }
        throw new DatabaseError(`Failed to update ${this.tableName}: ${error.message}`, error)
      }

      return updated as unknown as TableRow<T>
    } catch (error) {
      if (error instanceof DatabaseError || error instanceof NotFoundError) throw error
      throw new DatabaseError(`Unexpected error updating ${this.tableName}`, error)
    }
  }

  /**
   * Delete a record by ID
   * @param id - Record ID
   * @returns True if deleted, throws if not found
   */
  async delete(id: string): Promise<boolean> {
    try {
      const { error } = (await this.db
        .from(this.tableName)
        .delete()
        .eq('id' as any, id as any)) as any

      if (error) {
        throw new DatabaseError(`Failed to delete ${this.tableName}: ${error.message}`, error)
      }

      return true
    } catch (error) {
      if (error instanceof DatabaseError) throw error
      throw new DatabaseError(`Unexpected error deleting ${this.tableName}`, error)
    }
  }

  /**
   * Count records
   * @param filters - Optional filters to apply
   * @returns Number of records
   */
  async count(filters?: Partial<TableRow<T>>): Promise<number> {
    try {
      let query = this.db.from(this.tableName).select('*', { count: 'exact', head: true })

      if (filters) {
        Object.entries(filters).forEach(([key, value]) => {
          if (value !== undefined && value !== null) {
            query = query.eq(key, value)
          }
        })
      }

      const { count, error } = await query

      if (error) {
        throw new DatabaseError(`Failed to count ${this.tableName}: ${error.message}`, error)
      }

      return count || 0
    } catch (error) {
      if (error instanceof DatabaseError) throw error
      throw new DatabaseError(`Unexpected error counting ${this.tableName}`, error)
    }
  }
}
