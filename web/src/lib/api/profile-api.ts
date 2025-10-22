/**
 * Profile API Client
 *
 * Frontend API methods for Profile operations.
 * All profile-related API calls should go through these methods.
 */

import { apiClient } from './client'
import type { Profile, UpdateProfileDto } from '@/types/profile'

/**
 * Profile API methods
 */
export const profileApi = {
  /**
   * Get the current user's profile
   * @returns Profile
   */
  getCurrent: () => {
    return apiClient.get<Profile>('/profile')
  },

  /**
   * Get a profile by user ID
   * @param userId - User/Profile ID
   * @returns Profile
   */
  getById: (userId: string) => {
    return apiClient.get<Profile>(`/profile/${userId}`)
  },

  /**
   * Update the current user's profile
   * @param data - Profile data to update
   * @returns Updated profile
   */
  update: (data: UpdateProfileDto) => {
    return apiClient.put<Profile>('/profile', data)
  },

  /**
   * Update a profile by user ID (admin only)
   * @param userId - User/Profile ID
   * @param data - Profile data to update
   * @returns Updated profile
   */
  updateById: (userId: string, data: UpdateProfileDto) => {
    return apiClient.put<Profile>(`/profile/${userId}`, data)
  },

  /**
   * Delete a profile by user ID (admin only)
   * @param userId - User/Profile ID
   * @returns Deletion confirmation
   */
  delete: (userId: string) => {
    return apiClient.delete<{ deleted: boolean }>(`/profile/${userId}`)
  },
}
