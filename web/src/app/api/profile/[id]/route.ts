/**
 * Profile API Routes (by ID)
 *
 * GET /api/profile/[id] - Get a specific user's profile
 * PUT /api/profile/[id] - Update a specific user's profile (admin only)
 * DELETE /api/profile/[id] - Delete a profile (admin only)
 *
 * Now using clean architecture with auth service layer.
 * Direct Supabase calls have been abstracted away.
 */

import { NextRequest } from 'next/server'
import { profileService } from '@/lib/services/profile-service'
import { serverAuthService } from '@/lib/services/auth-service'
import { successResponse, handleApiError } from '@/lib/utils/response'

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
    const user = await serverAuthService.getCurrentUser()
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
    const user = await serverAuthService.getCurrentUser()
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
    const user = await serverAuthService.getCurrentUser()

    await profileService.deleteProfile(id, user.id)

    return successResponse({ deleted: true })
  } catch (error) {
    return handleApiError(error)
  }
}
