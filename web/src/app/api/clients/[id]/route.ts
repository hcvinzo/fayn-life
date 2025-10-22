/**
 * Client API Route (Single Client)
 * GET /api/clients/[id] - Get client by ID
 * PUT /api/clients/[id] - Update client
 * DELETE /api/clients/[id] - Delete client
 */

import { NextRequest } from 'next/server'
import { clientService } from '@/lib/services/client-service'
import { successResponse, handleApiError } from '@/lib/utils/response'
import { createClient } from '@/lib/supabase/server'

interface RouteContext {
  params: Promise<{
    id: string
  }>
}

async function getUserPracticeId(supabase: any, userId: string): Promise<string | null> {
  const { data: profile }: any = await supabase
    .from('profiles')
    .select('practice_id')
    .eq('id', userId)
    .single()

  return profile?.practice_id || null
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

    const practiceId = await getUserPracticeId(supabase, user.id)

    if (!practiceId) {
      return handleApiError(new Error('User is not associated with a practice'), 403)
    }

    const result = await clientService.getClientById(id, practiceId, user.id)

    if (!result.success) {
      return handleApiError(new Error(result.error || 'Client not found'), 404)
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

    const practiceId = await getUserPracticeId(supabase, user.id)

    if (!practiceId) {
      return handleApiError(new Error('User is not associated with a practice'), 403)
    }

    const result = await clientService.updateClient(id, practiceId, body, user.id)

    if (!result.success) {
      return handleApiError(new Error(result.error || 'Failed to update client'))
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

    const practiceId = await getUserPracticeId(supabase, user.id)

    if (!practiceId) {
      return handleApiError(new Error('User is not associated with a practice'), 403)
    }

    const result = await clientService.deleteClient(id, practiceId, user.id)

    if (!result.success) {
      return handleApiError(new Error(result.error || 'Failed to delete client'))
    }

    return successResponse({ message: 'Client deleted successfully' })
  } catch (error) {
    return handleApiError(error)
  }
}
