/**
 * Dashboard API Routes
 *
 * GET /api/dashboard - Get complete dashboard data
 */

import { NextRequest } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { serverDashboardService } from '@/lib/services/dashboard-service'
import { errorResponse, successResponse } from '@/lib/utils/response'

/**
 * GET /api/dashboard
 * Get dashboard data for authenticated user's practice
 */
export async function GET(request: NextRequest) {
  try {
    // Get authenticated user
    const supabase = await createClient()
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser()

    if (authError || !user) {
      return errorResponse('Unauthorized', 'UNAUTHORIZED', 401)
    }

    // Get user's profile to find practice_id and role
    const { data: profile, error: profileError }: any = await supabase
      .from('profiles')
      .select('practice_id, role')
      .eq('id', user.id)
      .single()

    if (profileError || !profile?.practice_id) {
      return errorResponse('Practice not found', 'NOT_FOUND', 404)
    }

    // Get dashboard data with role-based filtering
    // Practitioners see only their own data
    // Admins, staff, and assistants see practice-wide data
    const practitionerId = profile.role === 'practitioner' ? user.id : undefined
    const dashboardData = await serverDashboardService.getDashboardData(
      profile.practice_id,
      practitionerId
    )

    return successResponse(dashboardData)
  } catch (error) {
    console.error('Dashboard API error:', error)
    return errorResponse('Failed to fetch dashboard data', 'INTERNAL_ERROR', 500)
  }
}
