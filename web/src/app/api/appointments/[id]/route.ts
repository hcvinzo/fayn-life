/**
 * Appointment API Route (Single Appointment)
 * GET /api/appointments/[id] - Get appointment by ID
 * PUT /api/appointments/[id] - Update appointment
 * DELETE /api/appointments/[id] - Delete appointment
 */

import { NextRequest } from 'next/server'
import { appointmentService } from '@/lib/services/appointment-service'
import { successResponse, handleApiError } from '@/lib/utils/response'
import { createClient } from '@/lib/supabase/server'

interface RouteContext {
  params: Promise<{
    id: string
  }>
}

async function getUserProfile(supabase: any, userId: string): Promise<{ practice_id: string; role: string } | null> {
  const { data: profile }: any = await supabase
    .from('profiles')
    .select('practice_id, role')
    .eq('id', userId)
    .single()

  return profile?.practice_id ? { practice_id: profile.practice_id, role: profile.role } : null
}

export async function GET(
  request: NextRequest,
  context: RouteContext
) {
  try {
    const { id } = await context.params

    // Get user and practice_id
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
      return handleApiError(new Error('Unauthorized'), 401)
    }

    const profile = await getUserProfile(supabase, user.id)

    if (!profile) {
      return handleApiError(new Error('User is not associated with a practice'), 403)
    }

    const result = await appointmentService.getAppointmentById(id, profile.practice_id, user.id)

    if (!result.success) {
      return handleApiError(new Error(result.error || 'Appointment not found'), 404)
    }

    return successResponse(result.data)
  } catch (error) {
    return handleApiError(error)
  }
}

export async function PUT(
  request: NextRequest,
  context: RouteContext
) {
  try {
    const { id } = await context.params
    const body = await request.json()

    // Get user and practice_id
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
      return handleApiError(new Error('Unauthorized'), 401)
    }

    const profile = await getUserProfile(supabase, user.id)

    if (!profile) {
      return handleApiError(new Error('User is not associated with a practice'), 403)
    }

    // Role-based validation for practitioner_id changes
    // Practitioners cannot reassign appointments to other practitioners
    if (body.practitioner_id && profile.role === 'practitioner' && body.practitioner_id !== user.id) {
      return handleApiError(new Error('Practitioners cannot reassign appointments to other practitioners'), 403)
    }

    const result = await appointmentService.updateAppointment(id, profile.practice_id, body, user.id)

    if (!result.success) {
      return handleApiError(new Error(result.error || 'Failed to update appointment'))
    }

    return successResponse(result.data)
  } catch (error) {
    return handleApiError(error)
  }
}

export async function DELETE(
  request: NextRequest,
  context: RouteContext
) {
  try {
    const { id } = await context.params

    // Get user and practice_id
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
      return handleApiError(new Error('Unauthorized'), 401)
    }

    const profile = await getUserProfile(supabase, user.id)

    if (!profile) {
      return handleApiError(new Error('User is not associated with a practice'), 403)
    }

    const result = await appointmentService.deleteAppointment(id, profile.practice_id, user.id)

    if (!result.success) {
      return handleApiError(new Error(result.error || 'Failed to delete appointment'))
    }

    return successResponse({ message: 'Appointment deleted successfully' })
  } catch (error) {
    return handleApiError(error)
  }
}
