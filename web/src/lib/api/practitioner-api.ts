/**
 * Practitioner API Client
 * Frontend HTTP client for practitioner management (admin only)
 */

import { apiClient } from './client';
import type {
  Practitioner,
  PractitionerWithPractice,
  PractitionerFilters,
  CreatePractitionerInput,
  UpdatePractitionerInput,
} from '@/types/practitioner';

export const practitionerApi = {
  /**
   * Get all practitioners with optional filters
   */
  async getAll(filters?: PractitionerFilters): Promise<PractitionerWithPractice[]> {
    const params = new URLSearchParams();

    if (filters?.search) {
      params.append('search', filters.search);
    }
    if (filters?.status) {
      params.append('status', filters.status);
    }
    if (filters?.role) {
      params.append('role', filters.role);
    }
    if (filters?.practice_id) {
      params.append('practice_id', filters.practice_id);
    }

    const query = params.toString();
    const url = `/admin/practitioners${query ? `?${query}` : ''}`;

    return apiClient.get<PractitionerWithPractice[]>(url);
  },

  /**
   * Get a single practitioner by ID
   */
  async getById(id: string): Promise<PractitionerWithPractice> {
    return apiClient.get<PractitionerWithPractice>(`/admin/practitioners/${id}`);
  },

  /**
   * Create a new practitioner
   */
  async create(data: CreatePractitionerInput): Promise<Practitioner> {
    return apiClient.post<Practitioner>('/admin/practitioners', data);
  },

  /**
   * Update a practitioner
   */
  async update(id: string, data: UpdatePractitionerInput): Promise<Practitioner> {
    return apiClient.put<Practitioner>(`/admin/practitioners/${id}`, data);
  },

  /**
   * Delete a practitioner
   */
  async delete(id: string): Promise<void> {
    return apiClient.delete(`/admin/practitioners/${id}`);
  },
};

export type { Practitioner, PractitionerWithPractice, PractitionerFilters, CreatePractitionerInput, UpdatePractitionerInput };
