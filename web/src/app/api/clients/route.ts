/**
 * Clients API Route
 * GET /api/clients - List all clients for user's practice
 * POST /api/clients - Create a new client
 */

import { NextRequest } from 'next/server'
import { clientService } from '@/lib/services/client-service'
import { successResponse, handleApiError } from '@/lib/utils/response'
import { createClient } from '@/lib/supabase/server'

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const status = searchParams.get('status') as 'active' | 'inactive' | 'archived' | null
    const search = searchParams.get('search') || undefined

    // Get user and practice_id
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
      return handleApiError(new Error('Unauthorized'), 401)
    }

    // Get user's profile to get practice_id
    const { data: profile }: any = await supabase
      .from('profiles')
      .select('practice_id')
      .eq('id', user.id)
      .single()

    if (!profile?.practice_id) {
      return handleApiError(new Error('User is not associated with a practice'), 403)
    }

    const filters = {
      status: status || undefined,
      search,
    }

    const result = await clientService.getClientsByPractice(profile.practice_id, filters, user.id)

    if (!result.success) {
      return handleApiError(new Error(result.error || 'Failed to fetch clients'))
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

    // Get user's profile to get practice_id
    const { data: profile }: any = await supabase
      .from('profiles')
      .select('practice_id')
      .eq('id', user.id)
      .single()

    if (!profile?.practice_id) {
      return handleApiError(new Error('User is not associated with a practice'), 403)
    }

    // Ensure practice_id matches user's practice
    body.practice_id = profile.practice_id

    const result = await clientService.createClient(body, user.id)

    if (!result.success) {
      return handleApiError(new Error(result.error || 'Failed to create client'))
    }

    return successResponse(result.data, 201)
  } catch (error) {
    return handleApiError(error)
  }
}
