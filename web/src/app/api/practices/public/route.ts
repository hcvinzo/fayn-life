/**
 * Public Practices API Route
 * GET /api/practices/public
 *
 * Gets list of practices for registration (public access, no auth required)
 */

import { NextRequest } from 'next/server'
import { getPublicPractices } from '@/lib/services/practice-service'
import { successResponse, handleApiError } from '@/lib/utils/response'

export async function GET(request: NextRequest) {
  try {
    const practices = await getPublicPractices()

    return successResponse(practices)
  } catch (error) {
    return handleApiError(error)
  }
}
