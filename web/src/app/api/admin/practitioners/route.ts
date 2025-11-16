/**
 * Practitioners API Routes
 * Admin endpoints for managing practitioners
 */

import { NextRequest } from 'next/server';
import { practitionerService } from '@/lib/services/practitioner-service';
import { createClient } from '@/lib/supabase/server';
import type { PractitionerFilters } from '@/types/practitioner';
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
 * GET /api/admin/practitioners
 * Get all practitioners with optional filters
 */
export async function GET(request: NextRequest) {
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

    // Get query parameters
    const searchParams = request.nextUrl.searchParams;
    const filters: PractitionerFilters = {
      search: searchParams.get('search') || undefined,
      status: (searchParams.get('status') as any) || undefined,
      role: (searchParams.get('role') as any) || undefined,
      practice_id: searchParams.get('practice_id') || undefined,
    };

    const result = await practitionerService.getAll(filters);

    if (!result.success) {
      return errorResponse(result.error || 'Failed to fetch practitioners', 'FETCH_ERROR', 500);
    }

    return successResponse(result.data);
  } catch (error) {
    console.error('GET /api/admin/practitioners error:', error);
    return handleApiError(error);
  }
}

/**
 * POST /api/admin/practitioners
 * Create a new practitioner
 */
export async function POST(request: NextRequest) {
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

    const body = await request.json();
    const result = await practitionerService.create(body);

    if (!result.success) {
      return errorResponse(result.error || 'Failed to create practitioner', 'CREATE_ERROR', 400);
    }

    return successResponse(result.data, 201);
  } catch (error) {
    console.error('POST /api/admin/practitioners error:', error);
    return handleApiError(error);
  }
}
