/**
 * Individual Practitioner API Routes
 * Admin endpoints for managing individual practitioners
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
      return NextResponse.json({ error }, { status: error === 'Unauthorized' ? 401 : 403 });
    }

    const { id } = await params;
    const result = await practitionerService.getById(id);

    if (!result.success) {
      return NextResponse.json({ error: result.error }, { status: result.error === 'Practitioner not found' ? 404 : 500 });
    }

    return NextResponse.json(result.data);
  } catch (error) {
    console.error('GET /api/admin/practitioners/[id] error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
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
      return NextResponse.json({ error }, { status: error === 'Unauthorized' ? 401 : 403 });
    }

    const { id } = await params;
    const body = await request.json();
    const result = await practitionerService.update(id, body);

    if (!result.success) {
      return NextResponse.json(
        { error: result.error },
        { status: result.error === 'Practitioner not found' ? 404 : 400 }
      );
    }

    return NextResponse.json(result.data);
  } catch (error) {
    console.error('PUT /api/admin/practitioners/[id] error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
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
      return NextResponse.json({ error }, { status: error === 'Unauthorized' ? 401 : 403 });
    }

    const { id } = await params;
    const result = await practitionerService.delete(id);

    if (!result.success) {
      return NextResponse.json(
        { error: result.error },
        { status: result.error === 'Practitioner not found' ? 404 : 500 }
      );
    }

    return NextResponse.json({ message: 'Practitioner deleted successfully' });
  } catch (error) {
    console.error('DELETE /api/admin/practitioners/[id] error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
