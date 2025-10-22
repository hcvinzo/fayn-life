/**
 * Practices API Route
 * GET /api/practices - List all practices with optional search
 * POST /api/practices - Create a new practice
 */

import { NextRequest } from 'next/server'
import { practiceService } from '@/lib/services/practice-service'
import { successResponse, handleApiError } from '@/lib/utils/response'
import { createClient } from '@/lib/supabase/server'

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const search = searchParams.get('search') || undefined

    // Get user for authorization
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    const result = await practiceService.getAllPractices(search, user?.id)

    if (!result.success) {
      return handleApiError(new Error(result.error || 'Failed to fetch practices'))
    }

    return successResponse(result.data)
  } catch (error) {
    return handleApiError(error)
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()

    // Get user for authorization
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
      return handleApiError(new Error('Unauthorized'), 401)
    }

    const result = await practiceService.createPractice(body, user.id)

    if (!result.success) {
      return handleApiError(new Error(result.error || 'Failed to create practice'))
    }

    return successResponse(result.data, 201)
  } catch (error) {
    return handleApiError(error)
  }
}
