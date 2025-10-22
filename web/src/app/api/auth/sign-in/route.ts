/**
 * Sign In API Route
 * POST /api/auth/sign-in
 *
 * Authenticates a user with email and password
 */

import { NextRequest } from 'next/server'
import { serverAuthService } from '@/lib/services/auth-service'
import { successResponse, handleApiError } from '@/lib/utils/response'

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { email, password } = body

    if (!email || !password) {
      return handleApiError(new Error('Email and password are required'))
    }

    const result = await serverAuthService.signIn({
      email,
      password,
    })

    if (!result.success) {
      return handleApiError(new Error(result.error || 'Sign in failed'))
    }

    return successResponse(result.data)
  } catch (error) {
    return handleApiError(error)
  }
}
