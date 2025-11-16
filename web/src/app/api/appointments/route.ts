/**
 * Appointments API Route
 * GET /api/appointments - List all appointments for user's practice
 * POST /api/appointments - Create a new appointment
 */

import { NextRequest } from 'next/server'
import { appointmentService } from '@/lib/services/appointment-service'
import { successResponse, handleApiError } from '@/lib/utils/response'
import { createClient } from '@/lib/supabase/server'

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const status = searchParams.get('status') as
      | 'scheduled'
      | 'confirmed'
      | 'completed'
      | 'cancelled'
      | 'no_show'
      | null
    const clientId = searchParams.get('client_id') || undefined
    const startDate = searchParams.get('start_date') || undefined
    const endDate = searchParams.get('end_date') || undefined
    const includeClient = searchParams.get('include_client') === 'true'

    // Get user and practice_id
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
      return handleApiError(new Error('Unauthorized'), 401)
    }

    // Get user's profile to get practice_id and role
    const { data: profile }: any = await supabase
      .from('profiles')
      .select('practice_id, role')
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

    // Get dashboard data with role-based filtering
    // Practitioners see only their own data
    // Admins, staff, and assistants see practice-wide data
    const practitionerId = profile.role === 'practitioner' ? user.id : undefined

    // Use different service method based on include_client parameter
    const result = includeClient
      ? await appointmentService.getAppointmentsWithClient(profile.practice_id, filters, user.id, practitionerId)
      : await appointmentService.getAppointmentsByPractice(profile.practice_id, filters, user.id, practitionerId)

    if (!result.success) {
      return handleApiError(new Error(result.error || 'Failed to fetch appointments'))
    }

    return successResponse(result.data)
  } catch (error) {
    return handleApiError(error)
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()

    // Get user and practice_id
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
      return handleApiError(new Error('Unauthorized'), 401)
    }

    // Get user's profile to get practice_id and role
    const { data: profile }: any = await supabase
      .from('profiles')
      .select('practice_id, role')
      .eq('id', user.id)
      .single()

    if (!profile?.practice_id) {
      return handleApiError(new Error('User is not associated with a practice'), 403)
    }

    // Ensure practice_id matches user's practice
    body.practice_id = profile.practice_id

    // Role-based practitioner_id handling:
    // Practitioners can only create appointments for themselves
    // Admin/staff/assistants can create for any practitioner (use provided practitioner_id or default to self)
    if (profile.role === 'practitioner') {
      body.practitioner_id = user.id
    } else if (!body.practitioner_id) {
      // If admin/staff doesn't specify a practitioner_id, default to themselves
      body.practitioner_id = user.id
    }

    const result = await appointmentService.createAppointment(body, user.id)

    if (!result.success) {
      return handleApiError(new Error(result.error || 'Failed to create appointment'))
    }

    return successResponse(result.data, 201)
  } catch (error) {
    return handleApiError(error)
  }
}
