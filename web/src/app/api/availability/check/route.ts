/**
 * API Routes: /api/availability/check
 * Check if a practitioner is available for a specific time slot
 */

import { NextRequest } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { availabilityCheckService } from '@/lib/services/availability-service'
import { successResponse, handleApiError } from '@/lib/utils/response'

/**
 * POST /api/availability/check
 * Check availability for a specific appointment time
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

    const body = await request.json()

    // If practitioner_id not provided, use current user
    const practitionerId = body.practitioner_id || user.id

    const result = await availabilityCheckService.checkAvailability({
      practitioner_id: practitionerId,
      appointment_type: body.appointment_type,
      start_datetime: body.start_datetime,
      end_datetime: body.end_datetime,
    })

    return successResponse(result)
  } catch (error) {
    console.error('Failed to check availability:', error)
    return handleApiError(error)
  }
}
