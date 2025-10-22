/**
 * Profile Repository
 *
 * Data access layer for Profile entity.
 * Handles all database operations related to user profiles.
 */

import { BaseRepository } from './base-repository'
import type { Profile, CreateProfileDto, UpdateProfileDto } from '@/types/profile'
import { DatabaseError, ConflictError } from '@/lib/utils/errors'

class ProfileRepository extends BaseRepository<'profiles'> {
  constructor() {
    super('profiles')
  }

  /**
   * Find a profile by user ID (same as profile ID)
   * @param userId - User/Profile ID
   * @returns Profile or null if not found
   */
  async findByUserId(userId: string): Promise<Profile | null> {
    return this.findById(userId)
  }

  /**
   * Find a profile by email
   * @param email - User email
   * @returns Profile or null if not found
   */
  async findByEmail(email: string): Promise<Profile | null> {
    return this.findOne({ email } as any)
  }

  /**
   * Find profiles by practice ID
   * @param practiceId - Practice ID
   * @returns Array of profiles
   */
  async findByPracticeId(practiceId: string): Promise<Profile[]> {
    return this.findAll({ practice_id: practiceId } as any)
  }

  /**
   * Find profiles by role
   * @param role - User role
   * @returns Array of profiles
   */
  async findByRole(role: 'admin' | 'practitioner' | 'staff'): Promise<Profile[]> {
    return this.findAll({ role } as any)
  }

  /**
   * Create a new profile
   * @param data - Profile data
   * @returns Created profile
   */
  async createProfile(data: CreateProfileDto): Promise<Profile> {
    try {
      // Check if profile already exists
      const existing = await this.findByUserId(data.id)
      if (existing) {
        throw new ConflictError('Profile already exists for this user')
      }

      // Check if email is already in use
      if (data.email) {
        const existingEmail = await this.findByEmail(data.email)
        if (existingEmail) {
          throw new ConflictError('Email is already in use')
        }
      }

      return await this.create(data as any)
    } catch (error) {
      if (error instanceof ConflictError || error instanceof DatabaseError) {
        throw error
      }
      throw new DatabaseError('Failed to create profile', error)
    }
  }

  /**
   * Update a profile
   * @param userId - User/Profile ID
   * @param data - Profile data to update
   * @returns Updated profile
   */
  async updateProfile(userId: string, data: UpdateProfileDto): Promise<Profile> {
    try {
      // Add updated_at timestamp
      const updateData = {
        ...data,
        updated_at: new Date().toISOString(),
      }

      return await this.update(userId, updateData as any)
    } catch (error) {
      if (error instanceof DatabaseError) {
        throw error
      }
      throw new DatabaseError('Failed to update profile', error)
    }
  }

  /**
   * Delete a profile (soft delete by marking as inactive could be added)
   * @param userId - User/Profile ID
   * @returns True if deleted
   */
  async deleteProfile(userId: string): Promise<boolean> {
    return this.delete(userId)
  }

  /**
   * Check if a profile exists
   * @param userId - User/Profile ID
   * @returns True if exists
   */
  async exists(userId: string): Promise<boolean> {
    const profile = await this.findByUserId(userId)
    return profile !== null
  }
}

// Export singleton instance
export const profileRepository = new ProfileRepository()
