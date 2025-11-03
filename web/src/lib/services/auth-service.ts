/**
 * Authentication Service
 *
 * This service provides business logic for authentication operations.
 * It sits between the application layer (actions, hooks, API routes) and the repository layer.
 *
 * Responsibilities:
 * - Input validation using Zod schemas
 * - Business logic and authorization
 * - Error handling and transformation
 * - Coordinating between auth and profile operations
 *
 * Following the service pattern established in the codebase.
 */

import { User, Session } from '@supabase/supabase-js'
import {
  ServerAuthRepository,
  ClientAuthRepository,
  MiddlewareAuthRepository,
  type AuthResponse,
} from '@/lib/repositories/auth-repository'
import { profileRepository } from '@/lib/repositories/profile-repository'
import { availabilityService } from '@/lib/services/availability-service'
import {
  signInSchema,
  signUpSchema,
  resetPasswordSchema,
  type SignInInput,
  type SignUpInput,
  type ResetPasswordInput,
} from '@/lib/validators/auth-schema'
import {
  ValidationError,
  AuthError,
  UnauthorizedError,
} from '@/lib/utils/errors'
import type { Database } from '@/types/database'

type ProfileRow = Database['public']['Tables']['profiles']['Row']

export interface AuthServiceResponse {
  success: boolean
  data?: {
    user: User | null
    session: Session | null
    profile?: ProfileRow | null
  }
  error?: string
}

/**
 * Server-side authentication service
 * Used in Server Components, Server Actions, and Route Handlers
 */
export class ServerAuthService {
  private repository: ServerAuthRepository

  constructor() {
    this.repository = new ServerAuthRepository()
  }

  /**
   * Sign in with email and password
   */
  async signIn(input: SignInInput): Promise<AuthServiceResponse> {
    try {
      // Validate input
      const validated = signInSchema.parse(input)

      // Authenticate user
      const result = await this.repository.signInWithPassword({
        email: validated.email,
        password: validated.password,
      })

      // Fetch user profile to include role information
      let profile = null
      if (result.user) {
        try {
          profile = await profileRepository.findByUserId(result.user.id)
        } catch (error) {
          // Log error but don't fail sign-in if profile fetch fails
          console.error('Failed to fetch user profile:', error)
        }
      }

      return {
        success: true,
        data: {
          ...result,
          profile,
        },
      }
    } catch (error) {
      if (error instanceof ValidationError) {
        return {
          success: false,
          error: error.message,
        }
      }

      if (error instanceof AuthError) {
        return {
          success: false,
          error: error.message,
        }
      }

      // Handle Zod validation errors
      if (error && typeof error === 'object' && 'issues' in error) {
        const zodError = error as { issues: Array<{ message: string }> }
        return {
          success: false,
          error: zodError.issues[0]?.message || 'Validation failed',
        }
      }

      return {
        success: false,
        error: 'An unexpected error occurred during sign in',
      }
    }
  }

  /**
   * Sign up with email, password, and profile data
   * Orchestrates: 1) Create user in auth, 2) Create profile in database, 3) Set default availability
   */
  async signUp(input: SignUpInput): Promise<AuthServiceResponse> {
    try {
      // Validate input
      const validated = signUpSchema.parse(input)

      // Step 1: Create user in Supabase Auth
      const authResult = await this.repository.signUpUser({
        email: validated.email,
        password: validated.password,
        fullName: validated.fullName,
      })

      if (!authResult.user) {
        throw new AuthError('User creation failed')
      }

      // Step 2: Create profile in database
      const profile = await profileRepository.createProfile({
        id: authResult.user.id,
        email: validated.email,
        full_name: validated.fullName,
        practice_id: validated.practiceId || null,
        role: validated.role || 'practitioner',
      })

      // Step 3: Create default availability for practitioners (Mon-Fri, 9-5)
      // This runs in the background and doesn't block sign-up
      if ((validated.role === 'practitioner' || !validated.role) && validated.practiceId) {
        try {
          await availabilityService.resetToDefaults(
            validated.practiceId,
            authResult.user.id
          )
        } catch (error) {
          // Log error but don't fail sign-up
          console.error('Failed to create default availability:', error)
        }
      }

      return {
        success: true,
        data: {
          user: authResult.user,
          session: authResult.session,
          profile,
        },
      }
    } catch (error) {
      if (error instanceof ValidationError) {
        return {
          success: false,
          error: error.message,
        }
      }

      if (error instanceof AuthError) {
        return {
          success: false,
          error: error.message,
        }
      }

      // Handle Zod validation errors
      if (error && typeof error === 'object' && 'issues' in error) {
        const zodError = error as { issues: Array<{ message: string }> }
        return {
          success: false,
          error: zodError.issues[0]?.message || 'Validation failed',
        }
      }

      return {
        success: false,
        error: 'An unexpected error occurred during sign up',
      }
    }
  }

  /**
   * Sign out the current user
   */
  async signOut(): Promise<AuthServiceResponse> {
    try {
      await this.repository.signOut()

      return {
        success: true,
      }
    } catch (error) {
      if (error instanceof AuthError) {
        return {
          success: false,
          error: error.message,
        }
      }

      return {
        success: false,
        error: 'An unexpected error occurred during sign out',
      }
    }
  }

  /**
   * Send password reset email
   */
  async resetPassword(
    input: ResetPasswordInput,
    redirectTo?: string
  ): Promise<AuthServiceResponse> {
    try {
      // Validate input
      const validated = resetPasswordSchema.parse(input)

      // Send reset email
      await this.repository.resetPasswordForEmail(validated.email, {
        redirectTo,
      })

      return {
        success: true,
      }
    } catch (error) {
      if (error instanceof ValidationError) {
        return {
          success: false,
          error: error.message,
        }
      }

      if (error instanceof AuthError) {
        return {
          success: false,
          error: error.message,
        }
      }

      // Handle Zod validation errors
      if (error && typeof error === 'object' && 'issues' in error) {
        const zodError = error as { issues: Array<{ message: string }> }
        return {
          success: false,
          error: zodError.issues[0]?.message || 'Validation failed',
        }
      }

      return {
        success: false,
        error: 'An unexpected error occurred while sending reset email',
      }
    }
  }

  /**
   * Get current session
   */
  async getSession(): Promise<{ session: Session | null }> {
    try {
      return await this.repository.getSession()
    } catch (error) {
      if (error instanceof AuthError) {
        throw error
      }
      throw new AuthError('Failed to get session')
    }
  }

  /**
   * Get current user
   * Throws UnauthorizedError if no user is authenticated
   */
  async getCurrentUser(): Promise<User> {
    try {
      const { user } = await this.repository.getUser()

      if (!user) {
        throw new UnauthorizedError('Not authenticated')
      }

      return user
    } catch (error) {
      if (error instanceof UnauthorizedError || error instanceof AuthError) {
        throw error
      }
      throw new AuthError('Failed to get current user')
    }
  }

  /**
   * Get current user (returns null if not authenticated)
   */
  async getCurrentUserOrNull(): Promise<User | null> {
    try {
      const { user } = await this.repository.getUser()
      return user
    } catch (error) {
      return null
    }
  }
}

/**
 * Client-side authentication service
 * Used in Client Components
 */
export class ClientAuthService {
  private repository: ClientAuthRepository

  constructor() {
    this.repository = new ClientAuthRepository()
  }

  /**
   * Sign in with email and password
   */
  async signIn(input: SignInInput): Promise<AuthServiceResponse> {
    try {
      // Validate input
      const validated = signInSchema.parse(input)

      // Authenticate user
      const result = await this.repository.signInWithPassword({
        email: validated.email,
        password: validated.password,
      })

      return {
        success: true,
        data: result,
      }
    } catch (error) {
      if (error instanceof ValidationError) {
        return {
          success: false,
          error: error.message,
        }
      }

      if (error instanceof AuthError) {
        return {
          success: false,
          error: error.message,
        }
      }

      // Handle Zod validation errors
      if (error && typeof error === 'object' && 'issues' in error) {
        const zodError = error as { issues: Array<{ message: string }> }
        return {
          success: false,
          error: zodError.issues[0]?.message || 'Validation failed',
        }
      }

      return {
        success: false,
        error: 'An unexpected error occurred during sign in',
      }
    }
  }

  /**
   * Sign up with email, password, and profile data
   * Orchestrates: 1) Create user in auth, 2) Create profile in database
   */
  async signUp(input: SignUpInput): Promise<AuthServiceResponse> {
    try {
      // Validate input
      const validated = signUpSchema.parse(input)

      // Step 1: Create user in Supabase Auth
      const authResult = await this.repository.signUpUser({
        email: validated.email,
        password: validated.password,
        fullName: validated.fullName,
      })

      if (!authResult.user) {
        throw new AuthError('User creation failed')
      }

      // Step 2: Create profile in database
      const profile = await profileRepository.createProfile({
        id: authResult.user.id,
        email: validated.email,
        full_name: validated.fullName,
        practice_id: validated.practiceId || null,
        role: validated.role || 'practitioner',
      })

      return {
        success: true,
        data: {
          user: authResult.user,
          session: authResult.session,
          profile,
        },
      }
    } catch (error) {
      if (error instanceof ValidationError) {
        return {
          success: false,
          error: error.message,
        }
      }

      if (error instanceof AuthError) {
        return {
          success: false,
          error: error.message,
        }
      }

      // Handle Zod validation errors
      if (error && typeof error === 'object' && 'issues' in error) {
        const zodError = error as { issues: Array<{ message: string }> }
        return {
          success: false,
          error: zodError.issues[0]?.message || 'Validation failed',
        }
      }

      return {
        success: false,
        error: 'An unexpected error occurred during sign up',
      }
    }
  }

  /**
   * Sign out the current user
   */
  async signOut(): Promise<AuthServiceResponse> {
    try {
      await this.repository.signOut()

      return {
        success: true,
      }
    } catch (error) {
      if (error instanceof AuthError) {
        return {
          success: false,
          error: error.message,
        }
      }

      return {
        success: false,
        error: 'An unexpected error occurred during sign out',
      }
    }
  }

  /**
   * Get current session
   */
  async getSession(): Promise<{ session: Session | null }> {
    try {
      return await this.repository.getSession()
    } catch (error) {
      if (error instanceof AuthError) {
        throw error
      }
      throw new AuthError('Failed to get session')
    }
  }

  /**
   * Get profile for a user
   */
  async getProfile(userId: string): Promise<ProfileRow | null> {
    try {
      return await this.repository.getProfileByUserId(userId)
    } catch (error) {
      return null
    }
  }

  /**
   * Subscribe to auth state changes
   */
  onAuthStateChange(
    callback: (user: User | null, session: Session | null) => void
  ): () => void {
    return this.repository.onAuthStateChange(callback)
  }
}

/**
 * Middleware authentication service
 * Used in Next.js middleware for session management
 */
export class MiddlewareAuthService {
  private repository: MiddlewareAuthRepository

  constructor() {
    this.repository = new MiddlewareAuthRepository()
  }

  /**
   * Get current user in middleware context
   */
  async getCurrentUser(request: Request): Promise<User | null> {
    try {
      const { user } = await this.repository.getUser(request)
      return user
    } catch (error) {
      return null
    }
  }
}

// Singleton instances for convenience
export const serverAuthService = new ServerAuthService()
export const clientAuthService = new ClientAuthService()
export const middlewareAuthService = new MiddlewareAuthService()
