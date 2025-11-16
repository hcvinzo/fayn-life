/**
 * Individual Practitioner API Routes
 * Admin endpoints for managing individual practitioners
 */

import { NextRequest } from 'next/server';
import { practitionerService } from '@/lib/services/practitioner-service';
import { createClient } from '@/lib/supabase/server';
import { successResponse, errorResponse, handleApiError } from '@/lib/utils/response';

// Helper to check if user is admin
async function checkAdminAccess() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    return { authorized: false, error: 'Unauthorized' } as const;
  }

  // Get user profile to check role
  const { data: profile, error: profileError } = await supabase
    .from('profiles')
    .select('role')
    .eq('id', user.id)
    .single<{ role: string }>();

  if (profileError || !profile || profile.role !== 'admin') {
    return { authorized: false, error: 'Forbidden: Admin access required' } as const;
  }

  return { authorized: true } as const;
}

/**
 * GET /api/admin/practitioners/[id]
 * Get a single practitioner by ID
 */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    // Check admin access
    const { authorized, error } = await checkAdminAccess();
    if (!authorized) {
      return errorResponse(
        error!,
        error === 'Unauthorized' ? 'UNAUTHORIZED' : 'FORBIDDEN',
        error === 'Unauthorized' ? 401 : 403
      );
    }

    const { id } = await params;
    const result = await practitionerService.getById(id);

    if (!result.success) {
      return errorResponse(
        result.error || 'Failed to fetch practitioner',
        result.error === 'Practitioner not found' ? 'NOT_FOUND' : 'FETCH_ERROR',
        result.error === 'Practitioner not found' ? 404 : 500
      );
    }

    return successResponse(result.data);
  } catch (error) {
    console.error('GET /api/admin/practitioners/[id] error:', error);
    return handleApiError(error);
  }
}

/**
 * PUT /api/admin/practitioners/[id]
 * Update a practitioner
 */
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    // Check admin access
    const { authorized, error } = await checkAdminAccess();
    if (!authorized) {
      return errorResponse(
        error!,
        error === 'Unauthorized' ? 'UNAUTHORIZED' : 'FORBIDDEN',
        error === 'Unauthorized' ? 401 : 403
      );
    }

    const { id } = await params;
    const body = await request.json();
    const result = await practitionerService.update(id, body);

    if (!result.success) {
      return errorResponse(
        result.error || 'Failed to update practitioner',
        result.error === 'Practitioner not found' ? 'NOT_FOUND' : 'UPDATE_ERROR',
        result.error === 'Practitioner not found' ? 404 : 400
      );
    }

    return successResponse(result.data);
  } catch (error) {
    console.error('PUT /api/admin/practitioners/[id] error:', error);
    return handleApiError(error);
  }
}

/**
 * DELETE /api/admin/practitioners/[id]
 * Delete a practitioner
 */
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    // Check admin access
    const { authorized, error } = await checkAdminAccess();
    if (!authorized) {
      return errorResponse(
        error!,
        error === 'Unauthorized' ? 'UNAUTHORIZED' : 'FORBIDDEN',
        error === 'Unauthorized' ? 401 : 403
      );
    }

    const { id } = await params;
    const result = await practitionerService.delete(id);

    if (!result.success) {
      return errorResponse(
        result.error || 'Failed to delete practitioner',
        result.error === 'Practitioner not found' ? 'NOT_FOUND' : 'DELETE_ERROR',
        result.error === 'Practitioner not found' ? 404 : 500
      );
    }

    return successResponse({ message: 'Practitioner deleted successfully' });
  } catch (error) {
    console.error('DELETE /api/admin/practitioners/[id] error:', error);
    return handleApiError(error);
  }
}
