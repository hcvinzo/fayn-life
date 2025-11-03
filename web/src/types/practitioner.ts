/**
 * Practitioner Types
 * Type definitions for practitioner management in admin panel
 */

export type PractitionerStatus = 'active' | 'suspended' | 'blocked' | 'pending';
export type UserRole = 'admin' | 'practitioner' | 'staff';

export interface Practitioner {
  id: string;
  email: string;
  full_name: string | null;
  role: UserRole;
  status: PractitionerStatus;
  practice_id: string | null;
  avatar_url: string | null;
  created_at: string;
  updated_at: string;
}

export interface PractitionerWithPractice extends Practitioner {
  practice: {
    id: string;
    name: string;
  } | null;
}

export interface PractitionerFilters {
  search?: string;
  status?: PractitionerStatus | 'all';
  role?: UserRole | 'all';
}

export interface CreatePractitionerInput {
  email: string;
  full_name: string;
  role: UserRole;
  status?: PractitionerStatus;
  practice_id?: string | null;
}

export interface UpdatePractitionerInput {
  full_name?: string;
  role?: UserRole;
  status?: PractitionerStatus;
  practice_id?: string | null;
}
