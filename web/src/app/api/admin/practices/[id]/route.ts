/**
 * Individual Practice API Routes
 * Admin endpoints for managing individual practices
 */

import { NextRequest } from 'next/server';
import { practiceRepository } from '@/lib/repositories/practice-repository';
import { updatePracticeSchema } from '@/lib/validators/practice';
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
 * GET /api/admin/practices/[id]
 * Get a single practice by ID
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
    const practice = await practiceRepository.findById(id);

    if (!practice) {
      return errorResponse('Practice not found', 'NOT_FOUND', 404);
    }

    return successResponse(practice);
  } catch (error) {
    console.error('GET /api/admin/practices/[id] error:', error);
    return handleApiError(error);
  }
}

/**
 * PUT /api/admin/practices/[id]
 * Update a practice
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

    // Validate input
    const validated = updatePracticeSchema.parse(body);

    const practice = await practiceRepository.updatePractice(id, validated);

    return successResponse(practice);
  } catch (error) {
    console.error('PUT /api/admin/practices/[id] error:', error);
    return handleApiError(error, 400);
  }
}

/**
 * DELETE /api/admin/practices/[id]
 * Delete a practice
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
    const deleted = await practiceRepository.deletePractice(id);

    if (!deleted) {
      return errorResponse('Practice not found', 'NOT_FOUND', 404);
    }

    return successResponse({ message: 'Practice deleted successfully' });
  } catch (error) {
    console.error('DELETE /api/admin/practices/[id] error:', error);
    return handleApiError(error);
  }
}
