/**
 * Practice API Route (Single Practice)
 * GET /api/practices/[id] - Get practice by ID
 * PUT /api/practices/[id] - Update practice
 * DELETE /api/practices/[id] - Delete practice
 */

import { NextRequest } from 'next/server'
import { practiceService } from '@/lib/services/practice-service'
import { successResponse, handleApiError } from '@/lib/utils/response'
import { createClient } from '@/lib/supabase/server'

interface RouteContext {
  params: Promise<{
    id: string
  }>
}

export async function GET(
  request: NextRequest,
  context: RouteContext
) {
  try {
    const { id } = await context.params

    // Get user for authorization
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    const result = await practiceService.getPracticeById(id, user?.id)

    if (!result.success) {
      return handleApiError(new Error(result.error || 'Practice not found'), 404)
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

    // Get user for authorization
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
      return handleApiError(new Error('Unauthorized'), 401)
    }

    const result = await practiceService.updatePractice(id, body, user.id)

    if (!result.success) {
      return handleApiError(new Error(result.error || 'Failed to update practice'))
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

    // Get user for authorization
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
      return handleApiError(new Error('Unauthorized'), 401)
    }

    const result = await practiceService.deletePractice(id, user.id)

    if (!result.success) {
      return handleApiError(new Error(result.error || 'Failed to delete practice'))
    }

    return successResponse({ message: 'Practice deleted successfully' })
  } catch (error) {
    return handleApiError(error)
  }
}
