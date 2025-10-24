/**
 * Session by Appointment API Route
 *
 * GET /api/sessions/appointment/[id] - Get session for a specific appointment
 */

import { NextRequest } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { serverSessionService } from '@/lib/services/session-service'
import { successResponse, handleApiError } from '@/lib/utils/response'

/**
 * GET /api/sessions/appointment/[id]
 * Get session for a specific appointment
 */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: appointmentId } = await params

    // Get user
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
      return handleApiError(new Error('Unauthorized'), 401)
    }

    const session = await serverSessionService.getSessionByAppointment(appointmentId)

    return successResponse(session)
  } catch (error) {
    return handleApiError(error)
  }
}
