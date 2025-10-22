/**
 * Profile API Routes
 *
 * GET /api/profile - Get current user's profile
 * PUT /api/profile - Update current user's profile
 *
 * Now using clean architecture with auth service layer.
 * Direct Supabase calls have been abstracted away.
 */

import { NextRequest } from 'next/server'
import { profileService } from '@/lib/services/profile-service'
import { serverAuthService } from '@/lib/services/auth-service'
import { successResponse, handleApiError } from '@/lib/utils/response'

/**
 * GET /api/profile
 * Get the current user's profile
 */
export async function GET(request: NextRequest) {
  try {
    const user = await serverAuthService.getCurrentUser()
    const profile = await profileService.getProfile(user.id, user.id)

    return successResponse(profile)
  } catch (error) {
    return handleApiError(error)
  }
}

/**
 * PUT /api/profile
 * Update the current user's profile
 */
export async function PUT(request: NextRequest) {
  try {
    const user = await serverAuthService.getCurrentUser()
    const body = await request.json()

    const profile = await profileService.updateProfile(user.id, body, user.id)

    return successResponse(profile)
  } catch (error) {
    return handleApiError(error)
  }
}
