/**
 * Practitioner Repository
 * Handles database operations for practitioner management (admin only)
 */

import { createClient } from '../supabase/server';
import type { Practitioner, PractitionerWithPractice, PractitionerFilters } from '@/types/practitioner';

export class PractitionerRepository {
  /**
   * Get all practitioners with optional filters
   */
  async findAll(filters?: PractitionerFilters): Promise<PractitionerWithPractice[]> {
    const supabase = await createClient();

    let query = supabase
      .from('profiles')
      .select(`
        *,
        practice:practice_id (
          id,
          name
        )
      `)
      .order('created_at', { ascending: false });

    // Apply filters
    if (filters?.search) {
      query = query.or(`full_name.ilike.%${filters.search}%,email.ilike.%${filters.search}%`);
    }

    if (filters?.status && filters.status !== 'all') {
      query = query.eq('status', filters.status);
    }

    if (filters?.role && filters.role !== 'all') {
      query = query.eq('role', filters.role);
    }

    const { data, error } = await query;

    if (error) {
      throw new Error(`Failed to fetch practitioners: ${error.message}`);
    }

    return data || [];
  }

  /**
   * Get a single practitioner by ID
   */
  async findById(id: string): Promise<PractitionerWithPractice | null> {
    const supabase = await createClient();

    const { data, error } = await supabase
      .from('profiles')
      .select(`
        *,
        practice:practice_id (
          id,
          name
        )
      `)
      .eq('id', id)
      .single();

    if (error) {
      if (error.code === 'PGRST116') {
        return null; // Not found
      }
      throw new Error(`Failed to fetch practitioner: ${error.message}`);
    }

    return data;
  }

  /**
   * Create a new practitioner profile (without auth user creation)
   * Note: This should be called after auth user is created
   */
  async create(practitionerData: {
    id: string;
    email: string;
    full_name: string;
    role: string;
    status?: string;
    practice_id?: string | null;
  }): Promise<Practitioner> {
    const supabase = await createClient();

    const { data, error } = await supabase
      .from('profiles')
      .insert({
        id: practitionerData.id,
        email: practitionerData.email,
        full_name: practitionerData.full_name,
        role: practitionerData.role,
        status: practitionerData.status || 'active',
        practice_id: practitionerData.practice_id || null,
      })
      .select()
      .single();

    if (error) {
      throw new Error(`Failed to create practitioner profile: ${error.message}`);
    }

    return data;
  }

  /**
   * Update a practitioner
   */
  async update(
    id: string,
    updates: {
      full_name?: string;
      role?: string;
      status?: string;
      practice_id?: string | null;
    }
  ): Promise<Practitioner> {
    const supabase = await createClient();

    const { data, error} = await supabase
      .from('profiles')
      .update(updates)
      .eq('id', id)
      .select()
      .single();

    if (error) {
      throw new Error(`Failed to update practitioner: ${error.message}`);
    }

    return data;
  }

  /**
   * Delete a practitioner
   * Note: This will cascade delete related data due to foreign key constraints
   */
  async delete(id: string): Promise<void> {
    const supabase = await createClient();

    const { error } = await supabase
      .from('profiles')
      .delete()
      .eq('id', id);

    if (error) {
      throw new Error(`Failed to delete practitioner: ${error.message}`);
    }
  }

  /**
   * Count practitioners by status
   */
  async countByStatus(): Promise<Record<string, number>> {
    const supabase = await createClient();

    const { data, error } = await supabase
      .from('profiles')
      .select('status');

    if (error) {
      throw new Error(`Failed to count practitioners: ${error.message}`);
    }

    const counts: Record<string, number> = {
      active: 0,
      suspended: 0,
      blocked: 0,
      pending: 0,
    };

    data?.forEach((profile) => {
      if (profile.status in counts) {
        counts[profile.status]++;
      }
    });

    return counts;
  }
}

export const practitionerRepository = new PractitionerRepository();
