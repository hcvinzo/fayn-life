/**
 * Client Statistics API Route
 * GET /api/clients/stats - Get client statistics for practice
 */

import { NextRequest } from 'next/server'
import { clientService } from '@/lib/services/client-service'
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
      .select('practice_id')
      .eq('id', user.id)
      .single()

    if (!profile?.practice_id) {
      return handleApiError(new Error('User is not associated with a practice'), 403)
    }

    const result = await clientService.getClientStats(profile.practice_id, user.id)

    if (!result.success) {
      return handleApiError(new Error(result.error || 'Failed to fetch client stats'))
    }

    return successResponse(result.data)
  } catch (error) {
    return handleApiError(error)
  }
}
