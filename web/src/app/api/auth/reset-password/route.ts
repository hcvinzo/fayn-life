/**
 * Reset Password API Route
 * POST /api/auth/reset-password
 *
 * Sends a password reset email to the user
 */

import { NextRequest } from 'next/server'
import { serverAuthService } from '@/lib/services/auth-service'
import { successResponse, handleApiError } from '@/lib/utils/response'

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { email } = body

    if (!email) {
      return handleApiError(new Error('Email is required'))
    }

    const redirectTo = `${process.env.NEXT_PUBLIC_APP_URL}/auth/reset-password`

    const result = await serverAuthService.resetPassword(
      { email },
      redirectTo
    )

    if (!result.success) {
      return handleApiError(new Error(result.error || 'Password reset failed'))
    }

    return successResponse({ message: 'Password reset email sent' })
  } catch (error) {
    return handleApiError(error)
  }
}
