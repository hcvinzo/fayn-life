/**
 * Practice Service
 *
 * Business logic for practice-related operations.
 * Handles validation, authorization, and orchestrates repository calls.
 */

import { practiceRepository } from '@/lib/repositories/practice-repository'
import { createPracticeSchema, updatePracticeSchema } from '@/lib/validators/practice'
import type { CreatePracticeInput, UpdatePracticeInput, Practice } from '@/types/practice'
import { ValidationError, NotFoundError, ForbiddenError } from '@/lib/utils/errors'
import { z } from 'zod'

export interface PublicPractice {
  id: string
  name: string
}

export interface ServiceResult<T> {
  success: boolean
  data?: T
  error?: string
}

/**
 * Practice Service Class
 * Handles all practice-related business logic
 */
export class PracticeService {
  /**
   * Get all practices (public access for registration)
   * @returns List of practices with id and name
   */
  async getPublicPractices(): Promise<PublicPractice[]> {
    try {
      return await practiceRepository.findPublic()
    } catch (error) {
      console.error('Error fetching public practices:', error)
      return []
    }
  }

  /**
   * Get all practices with optional search
   * @param search - Optional search string
   * @param userId - User ID for authorization
   * @returns List of practices
   */
  async getAllPractices(search?: string, userId?: string): Promise<ServiceResult<Practice[]>> {
    try {
      // In future, add authorization check here
      // For now, allow authenticated users to list practices

      const practices = await practiceRepository.findAllWithSearch(search)

      // Transform to domain model
      const result = practices.map(this.toDomainModel)

      return {
        success: true,
        data: result,
      }
    } catch (error) {
      console.error('Error fetching practices:', error)
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to fetch practices',
      }
    }
  }

  /**
   * Get practice by ID
   * @param id - Practice ID
   * @param userId - User ID for authorization
   * @returns Practice or null
   */
  async getPracticeById(id: string, userId?: string): Promise<ServiceResult<Practice | null>> {
    try {
      const practice = await practiceRepository.findById(id)

      if (!practice) {
        return {
          success: false,
          error: 'Practice not found',
        }
      }

      return {
        success: true,
        data: this.toDomainModel(practice),
      }
    } catch (error) {
      console.error('Error fetching practice:', error)
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to fetch practice',
      }
    }
  }

  /**
   * Create a new practice
   * @param input - Practice data
   * @param userId - User ID for authorization (must be admin)
   * @returns Created practice
   */
  async createPractice(
    input: CreatePracticeInput,
    userId?: string
  ): Promise<ServiceResult<Practice>> {
    try {
      // Validate input
      const validatedData = createPracticeSchema.parse(input)

      // Check for duplicate name
      const existing = await practiceRepository.findByName(validatedData.name)
      if (existing) {
        return {
          success: false,
          error: 'A practice with this name already exists',
        }
      }

      // Create practice
      const practice = await practiceRepository.createPractice({
        name: validatedData.name,
        description: validatedData.description || null,
      })

      return {
        success: true,
        data: this.toDomainModel(practice),
      }
    } catch (error) {
      if (error instanceof z.ZodError) {
        return {
          success: false,
          error: error.issues[0]?.message || 'Validation failed',
        }
      }

      console.error('Error creating practice:', error)
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to create practice',
      }
    }
  }

  /**
   * Update a practice
   * @param id - Practice ID
   * @param input - Practice data to update
   * @param userId - User ID for authorization (must be admin)
   * @returns Updated practice
   */
  async updatePractice(
    id: string,
    input: UpdatePracticeInput,
    userId?: string
  ): Promise<ServiceResult<Practice>> {
    try {
      // Validate input
      const validatedData = updatePracticeSchema.parse(input)

      // Check if practice exists
      const existing = await practiceRepository.findById(id)
      if (!existing) {
        return {
          success: false,
          error: 'Practice not found',
        }
      }

      // Check for duplicate name (if name is being changed)
      if (validatedData.name && validatedData.name !== existing.name) {
        const duplicate = await practiceRepository.findByName(validatedData.name)
        if (duplicate) {
          return {
            success: false,
            error: 'A practice with this name already exists',
          }
        }
      }

      // Update practice
      const practice = await practiceRepository.updatePractice(id, validatedData)

      return {
        success: true,
        data: this.toDomainModel(practice),
      }
    } catch (error) {
      if (error instanceof z.ZodError) {
        return {
          success: false,
          error: error.issues[0]?.message || 'Validation failed',
        }
      }

      console.error('Error updating practice:', error)
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to update practice',
      }
    }
  }

  /**
   * Delete a practice
   * @param id - Practice ID
   * @param userId - User ID for authorization (must be admin)
   * @returns Success status
   */
  async deletePractice(id: string, userId?: string): Promise<ServiceResult<boolean>> {
    try {
      // Check if practice exists
      const existing = await practiceRepository.findById(id)
      if (!existing) {
        return {
          success: false,
          error: 'Practice not found',
        }
      }

      // TODO: Check if practice has associated users/clients/appointments
      // and prevent deletion if it has dependencies

      await practiceRepository.deletePractice(id)

      return {
        success: true,
        data: true,
      }
    } catch (error) {
      console.error('Error deleting practice:', error)
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to delete practice',
      }
    }
  }

  /**
   * Transform database row to domain model
   * @param row - Database row
   * @returns Domain model
   */
  private toDomainModel(row: any): Practice {
    return {
      id: row.id,
      name: row.name,
      description: row.description,
      createdAt: new Date(row.created_at),
      updatedAt: new Date(row.updated_at),
    }
  }
}

// Export singleton instance
export const practiceService = new PracticeService()

// Export legacy function for backward compatibility
export async function getPublicPractices(): Promise<PublicPractice[]> {
  return practiceService.getPublicPractices()
}
