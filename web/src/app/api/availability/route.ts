/**
 * API Routes: /api/availability
 * Handles practitioner regular schedule management
 */

import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { availabilityService } from '@/lib/services/availability-service'
import { successResponse, handleApiError } from '@/lib/utils/response'

/**
 * GET /api/availability
 * Get practitioner's regular schedule
 */
export async function GET() {
  try {
    const supabase = await createClient()
    const {
      data: { user },
    } = await supabase.auth.getUser()

    if (!user) {
      return handleApiError(new Error('Unauthorized'), 401)
    }

    const schedule = await availabilityService.getRegularSchedule(user.id)

    return successResponse(schedule)
  } catch (error) {
    console.error('Failed to fetch availability:', error)
    return handleApiError(error)
  }
}

/**
 * POST /api/availability
 * Create or bulk set availability slots
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

    // Check if bulk or single
    if (body.days && Array.isArray(body.days)) {
      // Bulk set
      const result = await availabilityService.setBulkAvailability(
        profile.practice_id,
        user.id,
        body
      )
      return successResponse(result, 201)
    } else {
      // Single slot
      const result = await availabilityService.createAvailabilitySlot(
        profile.practice_id,
        user.id,
        body
      )
      return successResponse(result, 201)
    }
  } catch (error) {
    console.error('Failed to create availability:', error)
    return handleApiError(error)
  }
}
