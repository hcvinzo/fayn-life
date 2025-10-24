/**
 * Session Detail API Routes
 *
 * GET /api/sessions/[id] - Get a specific session
 * PATCH /api/sessions/[id] - Update a session
 * DELETE /api/sessions/[id] - Delete a session
 */

import { NextRequest } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { serverSessionService } from '@/lib/services/session-service'
import { successResponse, handleApiError } from '@/lib/utils/response'

/**
 * GET /api/sessions/[id]
 * Get a specific session with details
 */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params

    // Get user and practice_id
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
      return handleApiError(new Error('Unauthorized'), 401)
    }

    // Get user's profile to get practice_id
    const { data: profile }: any = await supabase
      .from('profiles')
      .select('practice_id')
      .eq('id', user.id)
      .single()

    if (!profile?.practice_id) {
      return handleApiError(new Error('User is not associated with a practice'), 403)
    }

    const session = await serverSessionService.getSessionById(id, profile.practice_id)

    return successResponse(session)
  } catch (error) {
    return handleApiError(error)
  }
}

/**
 * PATCH /api/sessions/[id]
 * Update a session
 */
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const body = await request.json()

    // Get user and practice_id
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
      return handleApiError(new Error('Unauthorized'), 401)
    }

    // Get user's profile to get practice_id
    const { data: profile }: any = await supabase
      .from('profiles')
      .select('practice_id')
      .eq('id', user.id)
      .single()

    if (!profile?.practice_id) {
      return handleApiError(new Error('User is not associated with a practice'), 403)
    }

    const session = await serverSessionService.updateSession(id, body, profile.practice_id)

    return successResponse(session)
  } catch (error) {
    return handleApiError(error)
  }
}

/**
 * DELETE /api/sessions/[id]
 * Delete a session
 */
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params

    // Get user and practice_id
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
      return handleApiError(new Error('Unauthorized'), 401)
    }

    // Get user's profile to get practice_id
    const { data: profile }: any = await supabase
      .from('profiles')
      .select('practice_id')
      .eq('id', user.id)
      .single()

    if (!profile?.practice_id) {
      return handleApiError(new Error('User is not associated with a practice'), 403)
    }

    await serverSessionService.deleteSession(id, profile.practice_id)

    return successResponse({ success: true })
  } catch (error) {
    return handleApiError(error)
  }
}
