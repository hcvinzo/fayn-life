/**
 * Sign Up API Route
 * POST /api/auth/sign-up
 *
 * Registers a new user with email, password, and profile data
 */

import { NextRequest } from 'next/server'
import { serverAuthService } from '@/lib/services/auth-service'
import { successResponse, handleApiError } from '@/lib/utils/response'

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { email, password, confirmPassword, fullName, practiceId, role } = body

    if (!email || !password || !fullName) {
      return handleApiError(new Error('Email, password, and full name are required'))
    }

    const result = await serverAuthService.signUp({
      email,
      password,
      confirmPassword,
      fullName,
      practiceId: practiceId || null,
      role: role || 'practitioner',
    })

    if (!result.success) {
      return handleApiError(new Error(result.error || 'Sign up failed'))
    }

    return successResponse(result.data, 201)
  } catch (error) {
    return handleApiError(error)
  }
}
