/**
 * Profile API Routes (by ID)
 *
 * GET /api/profile/[id] - Get a specific user's profile
 * PUT /api/profile/[id] - Update a specific user's profile (admin only)
 * DELETE /api/profile/[id] - Delete a profile (admin only)
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
 * GET /api/profile/[id]
 * Get a specific user's profile
 */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const user = await getCurrentUser(request)
    const profile = await profileService.getProfile(id, user.id)

    return successResponse(profile)
  } catch (error) {
    return handleApiError(error)
  }
}

/**
 * PUT /api/profile/[id]
 * Update a specific user's profile
 */
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const user = await getCurrentUser(request)
    const body = await request.json()

    const profile = await profileService.updateProfile(id, body, user.id)

    return successResponse(profile)
  } catch (error) {
    return handleApiError(error)
  }
}

/**
 * DELETE /api/profile/[id]
 * Delete a profile (admin only)
 */
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const user = await getCurrentUser(request)

    await profileService.deleteProfile(id, user.id)

    return successResponse({ deleted: true })
  } catch (error) {
    return handleApiError(error)
  }
}
