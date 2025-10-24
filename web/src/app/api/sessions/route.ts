/**
 * Sessions API Routes
 *
 * GET /api/sessions - Get all sessions for practice
 * POST /api/sessions - Create a new session
 */

import { NextRequest } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { serverSessionService } from '@/lib/services/session-service'
import { successResponse, handleApiError } from '@/lib/utils/response'

/**
 * GET /api/sessions
 * Get all sessions for authenticated user's practice
 */
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const status = searchParams.get('status') as 'in_progress' | 'completed' | 'cancelled' | null
    const clientId = searchParams.get('client_id') || undefined
    const startDate = searchParams.get('start_date') || undefined
    const endDate = searchParams.get('end_date') || undefined

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

    const filters = {
      status: status || undefined,
      client_id: clientId,
      start_date: startDate,
      end_date: endDate,
    }

    const sessions = await serverSessionService.getSessionsByPractice(profile.practice_id, filters)

    return successResponse(sessions)
  } catch (error) {
    return handleApiError(error)
  }
}

/**
 * POST /api/sessions
 * Create a new session
 */
export async function POST(request: NextRequest) {
  try {
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

    // Ensure practice_id matches user's practice
    body.practice_id = profile.practice_id
    body.practitioner_id = user.id

    const session = await serverSessionService.createSession(body)

    return successResponse(session, 201)
  } catch (error) {
    return handleApiError(error)
  }
}
