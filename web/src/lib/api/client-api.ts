/**
 * Client API Client
 *
 * Frontend HTTP client for client operations.
 */

import { apiClient } from './client'

export interface Client {
  id: string
  practice_id: string
  first_name: string
  last_name: string
  email: string | null
  phone: string | null
  date_of_birth: string | null
  status: 'active' | 'inactive' | 'archived'
  notes: string | null
  created_at: string
  updated_at: string
  full_name: string // Computed field
}

export interface CreateClientInput {
  first_name: string
  last_name: string
  email?: string | null
  phone?: string | null
  date_of_birth?: string | null
  status?: 'active' | 'inactive' | 'archived'
  notes?: string | null
}

export interface UpdateClientInput {
  first_name?: string
  last_name?: string
  email?: string | null
  phone?: string | null
  date_of_birth?: string | null
  status?: 'active' | 'inactive' | 'archived'
  notes?: string | null
}

export interface ClientFilters {
  status?: 'active' | 'inactive' | 'archived'
  search?: string
}

export interface ClientStats {
  total: number
  active: number
  inactive: number
  archived: number
}

/**
 * Client API methods
 */
export const clientApi = {
  /**
   * Get all clients for user's practice with optional filters
   * @param filters - Optional filters (status, search)
   * @returns List of clients
   */
  getAll: (filters?: ClientFilters) => {
    const params = new URLSearchParams()
    if (filters?.status) params.append('status', filters.status)
    if (filters?.search) params.append('search', filters.search)

    const queryString = params.toString()
    return apiClient.get<Client[]>(`/clients${queryString ? `?${queryString}` : ''}`)
  },

  /**
   * Get client by ID
   * @param id - Client ID
   * @returns Client details
   */
  getById: (id: string) =>
    apiClient.get<Client>(`/clients/${id}`),

  /**
   * Create a new client
   * @param data - Client data
   * @returns Created client
   */
  create: (data: CreateClientInput) =>
    apiClient.post<Client>('/clients', data),

  /**
   * Update a client
   * @param id - Client ID
   * @param data - Client data to update
   * @returns Updated client
   */
  update: (id: string, data: UpdateClientInput) =>
    apiClient.put<Client>(`/clients/${id}`, data),

  /**
   * Archive a client (soft delete)
   * @param id - Client ID
   * @returns Archived client
   */
  archive: (id: string) =>
    apiClient.post<Client>(`/clients/${id}/archive`, {}),

  /**
   * Delete a client (hard delete)
   * @param id - Client ID
   * @returns Success message
   */
  delete: (id: string) =>
    apiClient.delete<{ message: string }>(`/clients/${id}`),

  /**
   * Get client statistics for practice
   * @returns Client statistics
   */
  getStats: () =>
    apiClient.get<ClientStats>('/clients/stats'),
}
