/**
 * Sign Out API Route
 * POST /api/auth/sign-out
 *
 * Signs out the current user
 */

import { NextRequest } from 'next/server'
import { serverAuthService } from '@/lib/services/auth-service'
import { successResponse, handleApiError } from '@/lib/utils/response'

export async function POST(request: NextRequest) {
  try {
    const result = await serverAuthService.signOut()

    if (!result.success) {
      return handleApiError(new Error(result.error || 'Sign out failed'))
    }

    return successResponse({ message: 'Signed out successfully' })
  } catch (error) {
    return handleApiError(error)
  }
}
