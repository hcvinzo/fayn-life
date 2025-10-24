/**
 * Files API Routes
 *
 * GET /api/files?entityType=xxx&entityId=xxx - Get files for an entity
 * POST /api/files - Create a file record
 * DELETE /api/files?id=xxx - Delete a file record
 */

import { NextRequest } from 'next/server'
import { fileRepository } from '@/lib/repositories/file-repository'
import type { EntityType } from '@/types/file'
import { successResponse, handleApiError } from '@/lib/utils/response'

/**
 * GET /api/files?entityType=xxx&entityId=xxx
 * Get all files for a specific entity
 */
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const entityType = searchParams.get('entityType') as EntityType
    const entityId = searchParams.get('entityId')

    if (!entityType || !entityId) {
      return handleApiError(new Error('entityType and entityId are required'), 400)
    }

    const files = await fileRepository.getFilesByEntity(entityType, entityId)
    return successResponse(files)
  } catch (error) {
    return handleApiError(error)
  }
}

/**
 * POST /api/files
 * Create a new file record
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const file = await fileRepository.createFile(body)
    return successResponse(file, 201)
  } catch (error) {
    return handleApiError(error)
  }
}

/**
 * DELETE /api/files?id=xxx
 * Delete a file record
 */
export async function DELETE(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const id = searchParams.get('id')

    if (!id) {
      return handleApiError(new Error('id is required'), 400)
    }

    await fileRepository.deleteFile(id)
    return successResponse({ success: true })
  } catch (error) {
    return handleApiError(error)
  }
}
