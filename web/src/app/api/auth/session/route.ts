/**
 * Session API Route
 * GET /api/auth/session
 *
 * Gets the current user's session and profile
 */

import { NextRequest } from 'next/server'
import { serverAuthService } from '@/lib/services/auth-service'
import { successResponse, handleApiError } from '@/lib/utils/response'

export async function GET(request: NextRequest) {
  try {
    // Get current user (returns null if not authenticated)
    const user = await serverAuthService.getCurrentUserOrNull()

    if (!user) {
      return successResponse({ user: null, profile: null })
    }

    // Get session
    const { session } = await serverAuthService.getSession()

    // Get profile
    const { profileRepository } = await import('@/lib/repositories/profile-repository')
    const profile = await profileRepository.findByUserId(user.id)

    return successResponse({
      user,
      session,
      profile,
    })
  } catch (error) {
    return handleApiError(error)
  }
}
