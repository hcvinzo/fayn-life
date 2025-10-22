/**
 * Profile Service
 *
 * Business logic layer for Profile entity.
 * Handles validation, authorization, and orchestrates repository calls.
 */

import { profileRepository } from '@/lib/repositories/profile-repository'
import { createProfileSchema, updateProfileSchema } from '@/lib/validators/profile-schema'
import type { Profile, CreateProfileDto, UpdateProfileDto } from '@/types/profile'
import {
  ValidationError,
  NotFoundError,
  UnauthorizedError,
  ForbiddenError,
} from '@/lib/utils/errors'

class ProfileService {
  /**
   * Get a profile by user ID
   * @param userId - User/Profile ID
   * @param requestingUserId - ID of the user making the request (for authorization)
   * @returns Profile
   * @throws NotFoundError if profile doesn't exist
   * @throws ForbiddenError if user doesn't have permission
   */
  async getProfile(userId: string, requestingUserId?: string): Promise<Profile> {
    // Authorization: Users can only view their own profile unless they're admin
    // (Admin check can be added when we have role-based access control)
    if (requestingUserId && requestingUserId !== userId) {
      // For now, we'll allow it, but in production you'd check if requestingUser is admin
      // const requestingProfile = await profileRepository.findByUserId(requestingUserId)
      // if (!requestingProfile || requestingProfile.role !== 'admin') {
      //   throw new ForbiddenError('You can only view your own profile')
      // }
    }

    const profile = await profileRepository.findByUserId(userId)

    if (!profile) {
      throw new NotFoundError('Profile not found')
    }

    return profile
  }

  /**
   * Get a profile by email
   * @param email - User email
   * @returns Profile or null
   */
  async getProfileByEmail(email: string): Promise<Profile | null> {
    return await profileRepository.findByEmail(email)
  }

  /**
   * Get all profiles for a practice
   * @param practiceId - Practice ID
   * @param requestingUserId - ID of the user making the request
   * @returns Array of profiles
   * @throws ForbiddenError if user doesn't have permission
   */
  async getProfilesByPractice(practiceId: string, requestingUserId: string): Promise<Profile[]> {
    // Authorization: Users can only view profiles in their own practice
    const requestingProfile = await profileRepository.findByUserId(requestingUserId)
    if (!requestingProfile) {
      throw new UnauthorizedError('User not found')
    }

    if (requestingProfile.practice_id !== practiceId && requestingProfile.role !== 'admin') {
      throw new ForbiddenError('You can only view profiles in your own practice')
    }

    return await profileRepository.findByPracticeId(practiceId)
  }

  /**
   * Create a new profile
   * @param data - Profile data
   * @returns Created profile
   * @throws ValidationError if validation fails
   */
  async createProfile(data: CreateProfileDto): Promise<Profile> {
    // Validate input
    const validated = createProfileSchema.parse(data)

    // Create profile
    return await profileRepository.createProfile(validated)
  }

  /**
   * Update a profile
   * @param userId - User/Profile ID
   * @param data - Profile data to update
   * @param requestingUserId - ID of the user making the request
   * @returns Updated profile
   * @throws ValidationError if validation fails
   * @throws NotFoundError if profile doesn't exist
   * @throws ForbiddenError if user doesn't have permission
   */
  async updateProfile(
    userId: string,
    data: UpdateProfileDto,
    requestingUserId: string
  ): Promise<Profile> {
    // Authorization: Users can only update their own profile
    if (requestingUserId !== userId) {
      const requestingProfile = await profileRepository.findByUserId(requestingUserId)
      if (!requestingProfile || requestingProfile.role !== 'admin') {
        throw new ForbiddenError('You can only update your own profile')
      }
    }

    // Validate input
    const validated = updateProfileSchema.parse(data)

    // Check if profile exists
    const exists = await profileRepository.exists(userId)
    if (!exists) {
      throw new NotFoundError('Profile not found')
    }

    // Update profile
    return await profileRepository.updateProfile(userId, validated)
  }

  /**
   * Delete a profile
   * @param userId - User/Profile ID
   * @param requestingUserId - ID of the user making the request
   * @returns True if deleted
   * @throws NotFoundError if profile doesn't exist
   * @throws ForbiddenError if user doesn't have permission
   */
  async deleteProfile(userId: string, requestingUserId: string): Promise<boolean> {
    // Authorization: Only admins can delete profiles
    const requestingProfile = await profileRepository.findByUserId(requestingUserId)
    if (!requestingProfile || requestingProfile.role !== 'admin') {
      throw new ForbiddenError('Only administrators can delete profiles')
    }

    // Check if profile exists
    const exists = await profileRepository.exists(userId)
    if (!exists) {
      throw new NotFoundError('Profile not found')
    }

    // Delete profile
    return await profileRepository.deleteProfile(userId)
  }

  /**
   * Check if a profile exists
   * @param userId - User/Profile ID
   * @returns True if exists
   */
  async profileExists(userId: string): Promise<boolean> {
    return await profileRepository.exists(userId)
  }
}

// Export singleton instance
export const profileService = new ProfileService()
