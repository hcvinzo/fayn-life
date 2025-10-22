/**
 * Profile API Routes
 *
 * GET /api/profile - Get current user's profile
 * PUT /api/profile - Update current user's profile
 */

import { NextRequest } from 'next/server'
import { profileService } from '@/lib/services/profile-service'
import { successResponse, handleApiError } from '@/lib/utils/response'
import { createClient } from '@/lib/supabase/server'
import { UnauthorizedError } from '@/lib/utils/errors'

/**
 * Get the current authenticated user from the request
 */
async function getCurrentUser(request: NextRequest) {
  const supabase = await createClient()
  const {
    data: { user },
    error,
  } = await supabase.auth.getUser()

  if (error || !user) {
    throw new UnauthorizedError('Authentication required')
  }

  return user
}

/**
 * GET /api/profile
 * Get the current user's profile
 */
export async function GET(request: NextRequest) {
  try {
    const user = await getCurrentUser(request)
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
    const user = await getCurrentUser(request)
    const body = await request.json()

    const profile = await profileService.updateProfile(user.id, body, user.id)

    return successResponse(profile)
  } catch (error) {
    return handleApiError(error)
  }
}
