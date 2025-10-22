/**
 * Practice API Client
 *
 * Frontend HTTP client for practice operations.
 */

import { apiClient } from './client'

export interface PublicPractice {
  id: string
  name: string
}

export interface Practice {
  id: string
  name: string
  description: string | null
  createdAt: Date
  updatedAt: Date
}

export interface CreatePracticeInput {
  name: string
  description?: string | null
}

export interface UpdatePracticeInput {
  name?: string
  description?: string | null
}

/**
 * Practice API methods
 */
export const practiceApi = {
  /**
   * Get all practices (public access for registration)
   * @returns List of practices with id and name
   */
  getPublic: () =>
    apiClient.get<PublicPractice[]>('/practices/public'),

  /**
   * Get all practices with optional search (authenticated)
   * @param search - Optional search string
   * @returns List of practices
   */
  getAll: (search?: string) => {
    const params = search ? `?search=${encodeURIComponent(search)}` : ''
    return apiClient.get<Practice[]>(`/practices${params}`)
  },

  /**
   * Get practice by ID
   * @param id - Practice ID
   * @returns Practice details
   */
  getById: (id: string) =>
    apiClient.get<Practice>(`/practices/${id}`),

  /**
   * Create a new practice
   * @param data - Practice data
   * @returns Created practice
   */
  create: (data: CreatePracticeInput) =>
    apiClient.post<Practice>('/practices', data),

  /**
   * Update a practice
   * @param id - Practice ID
   * @param data - Practice data to update
   * @returns Updated practice
   */
  update: (id: string, data: UpdatePracticeInput) =>
    apiClient.put<Practice>(`/practices/${id}`, data),

  /**
   * Delete a practice
   * @param id - Practice ID
   * @returns Success message
   */
  delete: (id: string) =>
    apiClient.delete<{ message: string }>(`/practices/${id}`),
}
