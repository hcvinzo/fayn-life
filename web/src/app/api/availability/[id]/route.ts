/**
 * API Routes: /api/availability/[id]
 * Handles individual availability slot operations
 */

import { NextRequest } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { availabilityService } from '@/lib/services/availability-service'
import { successResponse, handleApiError } from '@/lib/utils/response'

/**
 * PATCH /api/availability/[id]
 * Update an availability slot
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

    const result = await availabilityService.updateAvailabilitySlot(id, body)

    return successResponse(result)
  } catch (error) {
    console.error('Failed to update availability:', error)
    return handleApiError(error)
  }
}

/**
 * DELETE /api/availability/[id]
 * Delete an availability slot
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

    await availabilityService.deleteAvailabilitySlot(id)

    return successResponse({ message: 'Availability slot deleted successfully' })
  } catch (error) {
    console.error('Failed to delete availability:', error)
    return handleApiError(error)
  }
}
