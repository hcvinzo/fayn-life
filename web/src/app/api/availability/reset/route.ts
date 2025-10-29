/**
 * API Routes: /api/availability/reset
 * Reset availability to defaults
 */

import { NextRequest } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { availabilityService } from '@/lib/services/availability-service'
import { successResponse, handleApiError } from '@/lib/utils/response'

/**
 * POST /api/availability/reset
 * Reset practitioner's schedule to defaults (Mon-Fri, 9-5)
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

    const result = await availabilityService.resetToDefaults(
      profile.practice_id,
      user.id
    )

    return successResponse(result)
  } catch (error) {
    console.error('Failed to reset availability:', error)
    return handleApiError(error)
  }
}
