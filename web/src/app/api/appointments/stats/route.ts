/**
 * Appointment Statistics API Route
 * GET /api/appointments/stats - Get appointment statistics for practice
 */

import { NextRequest } from 'next/server'
import { appointmentService } from '@/lib/services/appointment-service'
import { successResponse, handleApiError } from '@/lib/utils/response'
import { createClient } from '@/lib/supabase/server'

export async function GET(request: NextRequest) {
  try {
    // Get user and practice_id
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
      return handleApiError(new Error('Unauthorized'), 401)
    }

    const { data: profile }: any = await supabase
      .from('profiles')
      .select('practice_id, role')
      .eq('id', user.id)
      .single()

    if (!profile?.practice_id) {
      return handleApiError(new Error('User is not associated with a practice'), 403)
    }

    // Role-based filtering: practitioners see only their own stats
    const practitionerId = profile.role === 'practitioner' ? user.id : undefined

    const result = await appointmentService.getAppointmentStats(profile.practice_id, user.id, practitionerId)

    if (!result.success) {
      return handleApiError(new Error(result.error || 'Failed to fetch appointment stats'))
    }

    return successResponse(result.data)
  } catch (error) {
    return handleApiError(error)
  }
}
