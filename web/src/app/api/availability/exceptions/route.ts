/**
 * API Routes: /api/availability/exceptions
 * Handles availability exception management (time off, modified hours, etc.)
 */

import { NextRequest } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { availabilityExceptionService } from '@/lib/services/availability-service'
import { successResponse, handleApiError } from '@/lib/utils/response'

/**
 * GET /api/availability/exceptions
 * Get all exceptions for the practitioner
 */
export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient()
    const {
      data: { user },
    } = await supabase.auth.getUser()

    if (!user) {
      return handleApiError(new Error('Unauthorized'), 401)
    }

    // Check for activeOnly query param
    const { searchParams } = new URL(request.url)
    const activeOnly = searchParams.get('activeOnly') !== 'false'

    const exceptions = await availabilityExceptionService.getExceptions(
      user.id,
      activeOnly
    )

    return successResponse(exceptions)
  } catch (error) {
    console.error('Failed to fetch exceptions:', error)
    return handleApiError(error)
  }
}

/**
 * POST /api/availability/exceptions
 * Create a new availability exception
 */
export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient()
    const {
      data: { user },
    } = await supabase.auth.getUser()

    if (!user) {
      return handleApiError(new Error('Unauthorized'), 401)
    }

    // Get user's practice
    const { data: profile } = await supabase
      .from('profiles')
      .select('practice_id')
      .eq('id', user.id)
      .single()

    if (!profile?.practice_id) {
      return handleApiError(new Error('Practice not found'), 404)
    }

    const body = await request.json()

    const result = await availabilityExceptionService.createException(
      profile.practice_id,
      user.id,
      body
    )

    return successResponse(result, 201)
  } catch (error) {
    console.error('Failed to create exception:', error)
    return handleApiError(error)
  }
}
