/**
 * Practice API Client
 *
 * Frontend HTTP client for practice operations.
 */

import { apiClient } from './client'
import type { Practice as PracticeType, PracticeFilters } from '@/types/practice'
import type { CreatePracticeInput as CreateInput, UpdatePracticeInput as UpdateInput } from '@/lib/validators/practice'

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

/**
 * Admin Practice API methods (for admin panel)
 */
export const adminPracticeApi = {
  /**
   * Get all practices with filters (admin only)
   * @param filters - Optional filters
   * @returns List of practices
   */
  getAll: (filters?: PracticeFilters) => {
    const params = new URLSearchParams();
    if (filters?.search) params.append('search', filters.search);
    if (filters?.status && filters.status !== 'all') params.append('status', filters.status);
    const query = params.toString();
    return apiClient.get<PracticeType[]>(`/admin/practices${query ? `?${query}` : ''}`);
  },

  /**
   * Get practice by ID (admin only)
   * @param id - Practice ID
   * @returns Practice details
   */
  getById: (id: string) =>
    apiClient.get<PracticeType>(`/admin/practices/${id}`),

  /**
   * Create a new practice (admin only)
   * @param data - Practice data
   * @returns Created practice
   */
  create: (data: CreateInput) =>
    apiClient.post<PracticeType>('/admin/practices', data),

  /**
   * Update a practice (admin only)
   * @param id - Practice ID
   * @param data - Practice data to update
   * @returns Updated practice
   */
  update: (id: string, data: UpdateInput) =>
    apiClient.put<PracticeType>(`/admin/practices/${id}`, data),

  /**
   * Delete a practice (admin only)
   * @param id - Practice ID
   * @returns Success message
   */
  delete: (id: string) =>
    apiClient.delete<{ message: string }>(`/admin/practices/${id}`),
}
