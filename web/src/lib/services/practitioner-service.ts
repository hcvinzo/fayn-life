/**
 * Practitioner Service
 * Business logic for admin practitioner management
 */

import { practitionerRepository } from '@/lib/repositories/practitioner-repository';
import { ServerAuthRepository } from '@/lib/repositories/auth-repository';
import { availabilityService } from '@/lib/services/availability-service';
import {
  createPractitionerSchema,
  updatePractitionerSchema,
  practitionerFiltersSchema,
  type CreatePractitionerInput,
  type UpdatePractitionerInput,
  type PractitionerFilters,
} from '@/lib/validators/practitioner-schema';
import type { Practitioner, PractitionerWithPractice } from '@/types/practitioner';

export interface PractitionerServiceResponse<T = any> {
  success: boolean;
  data?: T;
  error?: string;
}

export class PractitionerService {
  private authRepository: ServerAuthRepository;

  constructor() {
    this.authRepository = new ServerAuthRepository();
  }

  /**
   * Get all practitioners with optional filters
   */
  async getAll(filters?: PractitionerFilters): Promise<PractitionerServiceResponse<PractitionerWithPractice[]>> {
    try {
      // Validate filters if provided
      if (filters) {
        practitionerFiltersSchema.parse(filters);
      }

      const practitioners = await practitionerRepository.findAll(filters);

      return {
        success: true,
        data: practitioners,
      };
    } catch (error) {
      console.error('Error fetching practitioners:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to fetch practitioners',
      };
    }
  }

  /**
   * Get a single practitioner by ID
   */
  async getById(id: string): Promise<PractitionerServiceResponse<PractitionerWithPractice>> {
    try {
      const practitioner = await practitionerRepository.findById(id);

      if (!practitioner) {
        return {
          success: false,
          error: 'Practitioner not found',
        };
      }

      return {
        success: true,
        data: practitioner,
      };
    } catch (error) {
      console.error('Error fetching practitioner:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to fetch practitioner',
      };
    }
  }

  /**
   * Create a new practitioner
   * Orchestrates: 1) Create auth user, 2) Create profile, 3) Set default availability
   */
  async create(input: CreatePractitionerInput): Promise<PractitionerServiceResponse<Practitioner>> {
    try {
      // Validate input
      const validated = createPractitionerSchema.parse(input);

      // Step 1: Create user in Supabase Auth
      // Use provided password if available, otherwise generate temporary password
      const password = validated.password || this.generateTemporaryPassword();

      const authResult = await this.authRepository.signUpUser({
        email: validated.email,
        password: password,
        fullName: validated.full_name,
      });

      if (!authResult.user) {
        throw new Error('Failed to create auth user');
      }

      // Step 2: Create profile in database
      const practitioner = await practitionerRepository.create({
        id: authResult.user.id,
        email: validated.email,
        full_name: validated.full_name,
        role: validated.role,
        status: validated.status || 'pending', // Default to pending for new practitioners
        practice_id: validated.practice_id || null,
      });

      // Step 3: Create default availability for practitioners (Mon-Fri, 9-5)
      if (validated.role === 'practitioner' && validated.practice_id) {
        try {
          await availabilityService.resetToDefaults(
            validated.practice_id,
            authResult.user.id
          );
        } catch (error) {
          console.error('Failed to create default availability:', error);
          // Don't fail the creation if availability setup fails
        }
      }

      return {
        success: true,
        data: practitioner,
      };
    } catch (error) {
      console.error('Error creating practitioner:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to create practitioner',
      };
    }
  }

  /**
   * Update a practitioner
   */
  async update(id: string, input: UpdatePractitionerInput): Promise<PractitionerServiceResponse<Practitioner>> {
    try {
      // Validate input
      const validated = updatePractitionerSchema.parse(input);

      // Check if practitioner exists
      const existing = await practitionerRepository.findById(id);
      if (!existing) {
        return {
          success: false,
          error: 'Practitioner not found',
        };
      }

      // Update practitioner
      const updated = await practitionerRepository.update(id, validated);

      return {
        success: true,
        data: updated,
      };
    } catch (error) {
      console.error('Error updating practitioner:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to update practitioner',
      };
    }
  }

  /**
   * Delete a practitioner
   */
  async delete(id: string): Promise<PractitionerServiceResponse<void>> {
    try {
      // Check if practitioner exists
      const existing = await practitionerRepository.findById(id);
      if (!existing) {
        return {
          success: false,
          error: 'Practitioner not found',
        };
      }

      // Delete from profiles table (cascade will handle auth.users)
      await practitionerRepository.delete(id);

      return {
        success: true,
      };
    } catch (error) {
      console.error('Error deleting practitioner:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to delete practitioner',
      };
    }
  }

  /**
   * Get practitioner statistics by status
   */
  async getStatusCounts(): Promise<PractitionerServiceResponse<Record<string, number>>> {
    try {
      const counts = await practitionerRepository.countByStatus();

      return {
        success: true,
        data: counts,
      };
    } catch (error) {
      console.error('Error fetching status counts:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to fetch status counts',
      };
    }
  }

  /**
   * Generate a secure temporary password
   * This will be used for new practitioners who will need to reset their password
   */
  private generateTemporaryPassword(): string {
    const length = 16;
    const charset = 'abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789!@#$%^&*';
    let password = '';
    for (let i = 0; i < length; i++) {
      password += charset.charAt(Math.floor(Math.random() * charset.length));
    }
    return password;
  }
}

export const practitionerService = new PractitionerService();
