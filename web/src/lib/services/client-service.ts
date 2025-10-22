/**
 * Client Service
 *
 * Business logic for client-related operations.
 * Handles validation, authorization, and orchestrates repository calls.
 */

import { clientRepository } from '@/lib/repositories/client-repository'
import { createClientSchema, updateClientSchema } from '@/lib/validators/client-schema'
import type { CreateClientInput, UpdateClientInput } from '@/lib/validators/client-schema'
import type { Client, ClientFilters, ClientWithComputedFields } from '@/types/client'
import { z } from 'zod'

export interface ServiceResult<T> {
  success: boolean
  data?: T
  error?: string
}

/**
 * Client Service Class
 * Handles all client-related business logic
 */
export class ClientService {
  /**
   * Get all clients for a practice with optional filtering
   * @param practiceId - Practice ID
   * @param filters - Optional filters (status, search)
   * @param userId - User ID for authorization
   * @returns List of clients
   */
  async getClientsByPractice(
    practiceId: string,
    filters?: ClientFilters,
    userId?: string
  ): Promise<ServiceResult<ClientWithComputedFields[]>> {
    try {
      // TODO: Add authorization - verify user belongs to practice

      const clients = await clientRepository.findByPractice(practiceId, filters)

      // Transform to domain model with computed fields
      const result = clients.map(this.toDomainModel)

      return {
        success: true,
        data: result,
      }
    } catch (error) {
      console.error('Error fetching clients:', error)
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to fetch clients',
      }
    }
  }

  /**
   * Get client by ID
   * @param id - Client ID
   * @param practiceId - Practice ID for authorization
   * @param userId - User ID for authorization
   * @returns Client or null
   */
  async getClientById(
    id: string,
    practiceId: string,
    userId?: string
  ): Promise<ServiceResult<ClientWithComputedFields | null>> {
    try {
      // TODO: Add authorization - verify user belongs to practice

      const client = await clientRepository.findByIdAndPractice(id, practiceId)

      if (!client) {
        return {
          success: false,
          error: 'Client not found',
        }
      }

      return {
        success: true,
        data: this.toDomainModel(client),
      }
    } catch (error) {
      console.error('Error fetching client:', error)
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to fetch client',
      }
    }
  }

  /**
   * Create a new client
   * @param input - Client data
   * @param userId - User ID for authorization
   * @returns Created client
   */
  async createClient(
    input: CreateClientInput,
    userId?: string
  ): Promise<ServiceResult<ClientWithComputedFields>> {
    try {
      // Validate input
      const validatedData = createClientSchema.parse(input)

      // TODO: Add authorization - verify user belongs to practice

      // Check for duplicate email if provided
      if (validatedData.email) {
        const existing = await clientRepository.findByEmail(
          validatedData.email,
          validatedData.practice_id
        )
        if (existing) {
          return {
            success: false,
            error: 'A client with this email already exists in this practice',
          }
        }
      }

      // Create client
      const client = await clientRepository.createClient({
        practice_id: validatedData.practice_id,
        first_name: validatedData.first_name,
        last_name: validatedData.last_name,
        email: validatedData.email || null,
        phone: validatedData.phone || null,
        date_of_birth: validatedData.date_of_birth || null,
        status: validatedData.status || 'active',
        notes: validatedData.notes || null,
      })

      return {
        success: true,
        data: this.toDomainModel(client),
      }
    } catch (error) {
      if (error instanceof z.ZodError) {
        return {
          success: false,
          error: error.issues[0]?.message || 'Validation failed',
        }
      }

      console.error('Error creating client:', error)
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to create client',
      }
    }
  }

  /**
   * Update a client
   * @param id - Client ID
   * @param practiceId - Practice ID for authorization
   * @param input - Client data to update
   * @param userId - User ID for authorization
   * @returns Updated client
   */
  async updateClient(
    id: string,
    practiceId: string,
    input: UpdateClientInput,
    userId?: string
  ): Promise<ServiceResult<ClientWithComputedFields>> {
    try {
      // Validate input
      const validatedData = updateClientSchema.parse(input)

      // TODO: Add authorization - verify user belongs to practice

      // Check if client exists
      const existing = await clientRepository.findByIdAndPractice(id, practiceId)
      if (!existing) {
        return {
          success: false,
          error: 'Client not found',
        }
      }

      // Check for duplicate email if email is being changed
      if (validatedData.email && validatedData.email !== existing.email) {
        const duplicate = await clientRepository.findByEmail(validatedData.email, practiceId)
        if (duplicate && duplicate.id !== id) {
          return {
            success: false,
            error: 'A client with this email already exists in this practice',
          }
        }
      }

      // Update client
      const client = await clientRepository.updateClient(id, validatedData)

      return {
        success: true,
        data: this.toDomainModel(client),
      }
    } catch (error) {
      if (error instanceof z.ZodError) {
        return {
          success: false,
          error: error.issues[0]?.message || 'Validation failed',
        }
      }

      console.error('Error updating client:', error)
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to update client',
      }
    }
  }

  /**
   * Archive a client (soft delete)
   * @param id - Client ID
   * @param practiceId - Practice ID for authorization
   * @param userId - User ID for authorization
   * @returns Archived client
   */
  async archiveClient(
    id: string,
    practiceId: string,
    userId?: string
  ): Promise<ServiceResult<ClientWithComputedFields>> {
    try {
      // TODO: Add authorization - verify user belongs to practice

      // Check if client exists
      const existing = await clientRepository.findByIdAndPractice(id, practiceId)
      if (!existing) {
        return {
          success: false,
          error: 'Client not found',
        }
      }

      const client = await clientRepository.archiveClient(id)

      return {
        success: true,
        data: this.toDomainModel(client),
      }
    } catch (error) {
      console.error('Error archiving client:', error)
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to archive client',
      }
    }
  }

  /**
   * Delete a client (hard delete)
   * @param id - Client ID
   * @param practiceId - Practice ID for authorization
   * @param userId - User ID for authorization
   * @returns Success status
   */
  async deleteClient(
    id: string,
    practiceId: string,
    userId?: string
  ): Promise<ServiceResult<boolean>> {
    try {
      // TODO: Add authorization - verify user belongs to practice and has admin rights

      // Check if client exists
      const existing = await clientRepository.findByIdAndPractice(id, practiceId)
      if (!existing) {
        return {
          success: false,
          error: 'Client not found',
        }
      }

      // TODO: Check if client has associated appointments and prevent deletion

      await clientRepository.deleteClient(id)

      return {
        success: true,
        data: true,
      }
    } catch (error) {
      console.error('Error deleting client:', error)
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to delete client',
      }
    }
  }

  /**
   * Get client statistics for a practice
   * @param practiceId - Practice ID
   * @param userId - User ID for authorization
   * @returns Client statistics
   */
  async getClientStats(
    practiceId: string,
    userId?: string
  ): Promise<ServiceResult<{
    total: number
    active: number
    inactive: number
    archived: number
  }>> {
    try {
      // TODO: Add authorization - verify user belongs to practice

      const [total, active, inactive, archived] = await Promise.all([
        clientRepository.countByPractice(practiceId),
        clientRepository.countByPractice(practiceId, 'active'),
        clientRepository.countByPractice(practiceId, 'inactive'),
        clientRepository.countByPractice(practiceId, 'archived'),
      ])

      return {
        success: true,
        data: { total, active, inactive, archived },
      }
    } catch (error) {
      console.error('Error fetching client stats:', error)
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to fetch client stats',
      }
    }
  }

  /**
   * Transform database row to domain model with computed fields
   * @param row - Database row
   * @returns Domain model
   */
  private toDomainModel(row: any): ClientWithComputedFields {
    return {
      ...row,
      full_name: `${row.first_name} ${row.last_name}`,
    }
  }
}

// Export singleton instance
export const clientService = new ClientService()
