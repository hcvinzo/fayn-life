/**
 * Authentication API Client
 *
 * Frontend HTTP client for authentication operations.
 * This is the ONLY way frontend components should handle authentication.
 */

import { apiClient } from './client'
import type { User, Session } from '@supabase/supabase-js'
import type { Profile } from '@/types/profile'

export interface SignInInput {
  email: string
  password: string
}

export interface SignUpInput {
  email: string
  password: string
  confirmPassword: string
  fullName: string
  practiceId?: string | null
  role?: 'admin' | 'practitioner' | 'staff'
}

export interface ResetPasswordInput {
  email: string
}

export interface AuthResponse {
  user: User | null
  session: Session | null
  profile?: Profile | null
}

export interface SessionResponse {
  user: User | null
  session: Session | null
  profile: Profile | null
}

/**
 * Authentication API methods
 */
export const authApi = {
  /**
   * Sign in with email and password
   * @param email - User email
   * @param password - User password
   * @returns User, session, and profile data
   */
  signIn: (email: string, password: string) =>
    apiClient.post<AuthResponse>('/auth/sign-in', { email, password }),

  /**
   * Sign up with email, password, and profile data
   * @param data - Sign up data
   * @returns User, session, and profile data
   */
  signUp: (data: SignUpInput) =>
    apiClient.post<AuthResponse>('/auth/sign-up', data),

  /**
   * Sign out the current user
   */
  signOut: () =>
    apiClient.post<{ message: string }>('/auth/sign-out'),

  /**
   * Send password reset email
   * @param email - User email
   */
  resetPassword: (email: string) =>
    apiClient.post<{ message: string }>('/auth/reset-password', { email }),

  /**
   * Get current session and profile
   * @returns Current user, session, and profile (or null if not authenticated)
   */
  getSession: () =>
    apiClient.get<SessionResponse>('/auth/session'),
}
