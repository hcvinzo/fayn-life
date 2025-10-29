/**
 * API Routes: /api/availability/exceptions/[id]
 * Handles individual exception operations
 */

import { NextRequest } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { availabilityExceptionService } from '@/lib/services/availability-service'
import { successResponse, handleApiError } from '@/lib/utils/response'

/**
 * GET /api/availability/exceptions/[id]
 * Get a single exception by ID
 */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const supabase = await createClient()
    const {
      data: { user },
    } = await supabase.auth.getUser()

    if (!user) {
      return handleApiError(new Error('Unauthorized'), 401)
    }

    const { id } = await params

    const exception = await availabilityExceptionService.getExceptionById(id)

    if (!exception) {
      return handleApiError(new Error('Exception not found'), 404)
    }

    return successResponse(exception)
  } catch (error) {
    console.error('Failed to fetch exception:', error)
    return handleApiError(error)
  }
}

/**
 * PATCH /api/availability/exceptions/[id]
 * Update an exception
 */
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const supabase = await createClient()
    const {
      data: { user },
    } = await supabase.auth.getUser()

    if (!user) {
      return handleApiError(new Error('Unauthorized'), 401)
    }

    const { id } = await params
    const body = await request.json()

    const result = await availabilityExceptionService.updateException(id, body)

    return successResponse(result)
  } catch (error) {
    console.error('Failed to update exception:', error)
    return handleApiError(error)
  }
}

/**
 * DELETE /api/availability/exceptions/[id]
 * Delete an exception
 */
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const supabase = await createClient()
    const {
      data: { user },
    } = await supabase.auth.getUser()

    if (!user) {
      return handleApiError(new Error('Unauthorized'), 401)
    }

    const { id } = await params

    await availabilityExceptionService.deleteException(id)

    return successResponse({ message: 'Exception deleted successfully' })
  } catch (error) {
    console.error('Failed to delete exception:', error)
    return handleApiError(error)
  }
}
