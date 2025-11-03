/**
 * Practitioners API Routes
 * Admin endpoints for managing practitioners
 */

import { NextRequest, NextResponse } from 'next/server';
import { practitionerService } from '@/lib/services/practitioner-service';
import { createClient } from '@/lib/supabase/server';

// Helper to check if user is admin
async function checkAdminAccess() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    return { authorized: false, error: 'Unauthorized' };
  }

  // Get user profile to check role
  const { data: profile } = await supabase
    .from('profiles')
    .select('role')
    .eq('id', user.id)
    .single();

  if (!profile || profile.role !== 'admin') {
    return { authorized: false, error: 'Forbidden: Admin access required' };
  }

  return { authorized: true };
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
      return NextResponse.json({ error }, { status: error === 'Unauthorized' ? 401 : 403 });
    }

    // Get query parameters
    const searchParams = request.nextUrl.searchParams;
    const filters = {
      search: searchParams.get('search') || undefined,
      status: searchParams.get('status') || undefined,
      role: searchParams.get('role') || undefined,
    };

    const result = await practitionerService.getAll(filters);

    if (!result.success) {
      return NextResponse.json({ error: result.error }, { status: 500 });
    }

    return NextResponse.json(result.data);
  } catch (error) {
    console.error('GET /api/admin/practitioners error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
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
      return NextResponse.json({ error }, { status: error === 'Unauthorized' ? 401 : 403 });
    }

    const body = await request.json();
    const result = await practitionerService.create(body);

    if (!result.success) {
      return NextResponse.json({ error: result.error }, { status: 400 });
    }

    return NextResponse.json(result.data, { status: 201 });
  } catch (error) {
    console.error('POST /api/admin/practitioners error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
