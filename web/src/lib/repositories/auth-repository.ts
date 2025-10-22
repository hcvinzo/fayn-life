/**
 * Authentication Repository
 *
 * This repository handles all authentication-related database operations.
 * It provides a clean abstraction over Supabase Auth API.
 *
 * Following the repository pattern established in the codebase:
 * - Uses Supabase clients (server/client/middleware)
 * - Returns standardized responses
 * - Handles low-level auth operations
 * - Does NOT contain business logic (that's in auth-service.ts)
 */

import { User, Session } from '@supabase/supabase-js'
import type { Database } from '@/types/database'
import { AuthError, DatabaseError } from '@/lib/utils/errors'

type ProfileRow = Database['public']['Tables']['profiles']['Row']
type ProfileInsert = Database['public']['Tables']['profiles']['Insert']
type ProfileUpdate = Database['public']['Tables']['profiles']['Update']

export interface AuthCredentials {
  email: string
  password: string
}

export interface SignUpData extends AuthCredentials {
  fullName: string
  practiceId?: string
  role?: 'admin' | 'practitioner' | 'staff'
}

export interface AuthResponse {
  user: User | null
  session: Session | null
  profile?: ProfileRow | null
}

export interface ResetPasswordOptions {
  redirectTo?: string
}

/**
 * Server-side auth repository
 * Used in Server Components, Server Actions, and Route Handlers
 */
export class ServerAuthRepository {
  /**
   * Sign in with email and password
   */
  async signInWithPassword(
    credentials: AuthCredentials
  ): Promise<AuthResponse> {
    try {
      const { createClient } = await import('@/lib/supabase/server')
      const supabase = await createClient()

      const { data, error } = await supabase.auth.signInWithPassword({
        email: credentials.email,
        password: credentials.password,
      })

      if (error) {
        throw new AuthError(error.message)
      }

      // Fetch profile data
      const profile = await this.getProfileByUserId(data.user.id)

      return {
        user: data.user,
        session: data.session,
        profile,
      }
    } catch (error) {
      if (error instanceof AuthError) {
        throw error
      }
      throw new AuthError('Failed to sign in')
    }
  }

  /**
   * Sign up with email, password, and profile data
   */
  async signUp(signUpData: SignUpData): Promise<AuthResponse> {
    try {
      const { createClient } = await import('@/lib/supabase/server')
      const supabase = await createClient()

      const { data, error } = await supabase.auth.signUp({
        email: signUpData.email,
        password: signUpData.password,
        options: {
          data: {
            full_name: signUpData.fullName,
          },
        },
      })

      if (error) {
        throw new AuthError(error.message)
      }

      if (!data.user) {
        throw new AuthError('User creation failed')
      }

      // Update profile (created by database trigger) with practice_id and role
      // The trigger automatically creates a profile with id, email, and full_name
      // We just need to update it with the additional fields
      const profile = await this.updateProfile(data.user.id, {
        practice_id: signUpData.practiceId || null,
        role: signUpData.role || 'practitioner',
      })

      return {
        user: data.user,
        session: data.session,
        profile,
      }
    } catch (error) {
      if (error instanceof AuthError || error instanceof DatabaseError) {
        throw error
      }
      throw new AuthError('Failed to sign up')
    }
  }

  /**
   * Sign out the current user
   */
  async signOut(): Promise<void> {
    try {
      const { createClient } = await import('@/lib/supabase/server')
      const supabase = await createClient()

      const { error } = await supabase.auth.signOut()

      if (error) {
        throw new AuthError(error.message)
      }
    } catch (error) {
      if (error instanceof AuthError) {
        throw error
      }
      throw new AuthError('Failed to sign out')
    }
  }

  /**
   * Send password reset email
   */
  async resetPasswordForEmail(
    email: string,
    options?: ResetPasswordOptions
  ): Promise<void> {
    try {
      const { createClient } = await import('@/lib/supabase/server')
      const supabase = await createClient()

      const { error } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: options?.redirectTo,
      })

      if (error) {
        throw new AuthError(error.message)
      }
    } catch (error) {
      if (error instanceof AuthError) {
        throw error
      }
      throw new AuthError('Failed to send reset password email')
    }
  }

  /**
   * Get current session
   */
  async getSession(): Promise<{ session: Session | null }> {
    try {
      const { createClient } = await import('@/lib/supabase/server')
      const supabase = await createClient()

      const { data, error } = await supabase.auth.getSession()

      if (error) {
        throw new AuthError(error.message)
      }

      return { session: data.session }
    } catch (error) {
      if (error instanceof AuthError) {
        throw error
      }
      throw new AuthError('Failed to get session')
    }
  }

  /**
   * Get current user
   */
  async getUser(): Promise<{ user: User | null }> {
    try {
      const { createClient } = await import('@/lib/supabase/server')
      const supabase = await createClient()

      const { data, error } = await supabase.auth.getUser()

      if (error) {
        throw new AuthError(error.message)
      }

      return { user: data.user }
    } catch (error) {
      if (error instanceof AuthError) {
        throw error
      }
      throw new AuthError('Failed to get user')
    }
  }

  /**
   * Get profile by user ID
   */
  private async getProfileByUserId(
    userId: string
  ): Promise<ProfileRow | null> {
    try {
      const { createClient } = await import('@/lib/supabase/server')
      const supabase = await createClient()

      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', userId)
        .single()

      if (error) {
        // Don't throw if profile doesn't exist yet
        if (error.code === 'PGRST116') {
          return null
        }
        throw new DatabaseError(error.message)
      }

      return data
    } catch (error) {
      if (error instanceof DatabaseError) {
        throw error
      }
      throw new DatabaseError('Failed to fetch profile')
    }
  }

  /**
   * Update user profile
   */
  private async updateProfile(
    userId: string,
    profileData: ProfileUpdate
  ): Promise<ProfileRow> {
    try {
      const { createClient } = await import('@/lib/supabase/server')
      const supabase = await createClient()

      const { data, error } = await supabase
        .from('profiles')
        // @ts-ignore - Type mismatch due to ProfileUpdate vs generated types
        .update(profileData)
        .eq('id', userId)
        .select()
        .single()

      if (error) {
        throw new DatabaseError(error.message)
      }

      if (!data) {
        throw new DatabaseError('Profile not found')
      }

      return data
    } catch (error) {
      if (error instanceof DatabaseError) {
        throw error
      }
      throw new DatabaseError('Failed to update profile')
    }
  }

  /**
   * Create user profile
   */
  private async createProfile(
    profileData: ProfileInsert
  ): Promise<ProfileRow> {
    try {
      const { createClient } = await import('@/lib/supabase/server')
      const supabase = await createClient()

      const { data, error } = await supabase
        .from('profiles')
        .insert(profileData as any)
        .select()
        .single()

      if (error) {
        throw new DatabaseError(error.message)
      }

      return data
    } catch (error) {
      if (error instanceof DatabaseError) {
        throw error
      }
      throw new DatabaseError('Failed to create profile')
    }
  }
}

/**
 * Client-side auth repository
 * Used in Client Components
 */
export class ClientAuthRepository {
  /**
   * Sign in with email and password
   */
  async signInWithPassword(
    credentials: AuthCredentials
  ): Promise<AuthResponse> {
    try {
      const { createClient } = await import('@/lib/supabase/client')
      const supabase = createClient()

      const { data, error } = await supabase.auth.signInWithPassword({
        email: credentials.email,
        password: credentials.password,
      })

      if (error) {
        throw new AuthError(error.message)
      }

      // Fetch profile data
      const profile = await this.getProfileByUserId(data.user.id)

      return {
        user: data.user,
        session: data.session,
        profile,
      }
    } catch (error) {
      if (error instanceof AuthError) {
        throw error
      }
      throw new AuthError('Failed to sign in')
    }
  }

  /**
   * Sign up with email, password, and profile data
   */
  async signUp(signUpData: SignUpData): Promise<AuthResponse> {
    try {
      const { createClient } = await import('@/lib/supabase/client')
      const supabase = createClient()

      const { data, error } = await supabase.auth.signUp({
        email: signUpData.email,
        password: signUpData.password,
        options: {
          data: {
            full_name: signUpData.fullName,
          },
        },
      })

      if (error) {
        throw new AuthError(error.message)
      }

      if (!data.user) {
        throw new AuthError('User creation failed')
      }

      // Update profile (created by database trigger) with practice_id and role
      // The trigger automatically creates a profile with id, email, and full_name
      // We just need to update it with the additional fields
      const profile = await this.updateProfile(data.user.id, {
        practice_id: signUpData.practiceId || null,
        role: signUpData.role || 'practitioner',
      })

      return {
        user: data.user,
        session: data.session,
        profile,
      }
    } catch (error) {
      if (error instanceof AuthError || error instanceof DatabaseError) {
        throw error
      }
      throw new AuthError('Failed to sign up')
    }
  }

  /**
   * Sign out the current user
   */
  async signOut(): Promise<void> {
    try {
      const { createClient } = await import('@/lib/supabase/client')
      const supabase = createClient()

      const { error } = await supabase.auth.signOut()

      if (error) {
        throw new AuthError(error.message)
      }
    } catch (error) {
      if (error instanceof AuthError) {
        throw error
      }
      throw new AuthError('Failed to sign out')
    }
  }

  /**
   * Get current session
   */
  async getSession(): Promise<{ session: Session | null }> {
    try {
      const { createClient } = await import('@/lib/supabase/client')
      const supabase = createClient()

      const { data, error } = await supabase.auth.getSession()

      if (error) {
        throw new AuthError(error.message)
      }

      return { session: data.session }
    } catch (error) {
      if (error instanceof AuthError) {
        throw error
      }
      throw new AuthError('Failed to get session')
    }
  }

  /**
   * Subscribe to auth state changes
   */
  onAuthStateChange(
    callback: (user: User | null, session: Session | null) => void
  ): () => void {
    const { createClient } = require('@/lib/supabase/client')
    const supabase = createClient()

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event: any, session: Session | null) => {
      callback(session?.user ?? null, session)
    })

    return () => subscription.unsubscribe()
  }

  /**
   * Get profile by user ID
   */
  async getProfileByUserId(userId: string): Promise<ProfileRow | null> {
    try {
      const { createClient } = await import('@/lib/supabase/client')
      const supabase = createClient()

      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', userId)
        .single()

      if (error) {
        // Don't throw if profile doesn't exist yet
        if (error.code === 'PGRST116') {
          return null
        }
        throw new DatabaseError(error.message)
      }

      return data
    } catch (error) {
      if (error instanceof DatabaseError) {
        throw error
      }
      throw new DatabaseError('Failed to fetch profile')
    }
  }

  /**
   * Update user profile
   */
  private async updateProfile(
    userId: string,
    profileData: ProfileUpdate
  ): Promise<ProfileRow> {
    try {
      const { createClient } = await import('@/lib/supabase/client')
      const supabase = createClient()

      const { data, error } = await supabase
        .from('profiles')
        // @ts-ignore - Type mismatch due to ProfileUpdate vs generated types
        .update(profileData)
        .eq('id', userId)
        .select()
        .single()

      if (error) {
        throw new DatabaseError(error.message)
      }

      if (!data) {
        throw new DatabaseError('Profile not found')
      }

      return data
    } catch (error) {
      if (error instanceof DatabaseError) {
        throw error
      }
      throw new DatabaseError('Failed to update profile')
    }
  }

  /**
   * Create user profile
   */
  private async createProfile(
    profileData: ProfileInsert
  ): Promise<ProfileRow> {
    try {
      const { createClient } = await import('@/lib/supabase/client')
      const supabase = createClient()

      const { data, error } = await supabase
        .from('profiles')
        .insert(profileData as any)
        .select()
        .single()

      if (error) {
        throw new DatabaseError(error.message)
      }

      return data
    } catch (error) {
      if (error instanceof DatabaseError) {
        throw error
      }
      throw new DatabaseError('Failed to create profile')
    }
  }
}

/**
 * Middleware auth repository
 * Used in Next.js middleware for session management
 */
export class MiddlewareAuthRepository {
  /**
   * Get current user in middleware context
   */
  async getUser(request: Request): Promise<{ user: User | null }> {
    try {
      const { createClient } = await import('@/lib/supabase/middleware')
      const { supabase } = createClient(request as any)

      const { data, error } = await supabase.auth.getUser()

      if (error) {
        throw new AuthError(error.message)
      }

      return { user: data.user }
    } catch (error) {
      if (error instanceof AuthError) {
        throw error
      }
      throw new AuthError('Failed to get user')
    }
  }
}
