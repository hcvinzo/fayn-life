/**
 * Individual Practice API Routes
 * Admin endpoints for managing individual practices
 */

import { NextRequest, NextResponse } from 'next/server';
import { practiceRepository } from '@/lib/repositories/practice-repository';
import { updatePracticeSchema } from '@/lib/validators/practice';
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
      return NextResponse.json({ error }, { status: error === 'Unauthorized' ? 401 : 403 });
    }

    const { id } = await params;
    const practice = await practiceRepository.findById(id);

    if (!practice) {
      return NextResponse.json({ error: 'Practice not found' }, { status: 404 });
    }

    return NextResponse.json(practice);
  } catch (error) {
    console.error('GET /api/admin/practices/[id] error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
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
      return NextResponse.json({ error }, { status: error === 'Unauthorized' ? 401 : 403 });
    }

    const { id } = await params;
    const body = await request.json();

    // Validate input
    const validated = updatePracticeSchema.parse(body);

    const practice = await practiceRepository.updatePractice(id, validated);

    return NextResponse.json(practice);
  } catch (error) {
    console.error('PUT /api/admin/practices/[id] error:', error);

    if (error instanceof Error && error.name === 'ZodError') {
      return NextResponse.json({ error: 'Invalid input' }, { status: 400 });
    }

    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
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
      return NextResponse.json({ error }, { status: error === 'Unauthorized' ? 401 : 403 });
    }

    const { id } = await params;
    const deleted = await practiceRepository.deletePractice(id);

    if (!deleted) {
      return NextResponse.json({ error: 'Practice not found' }, { status: 404 });
    }

    return NextResponse.json({ message: 'Practice deleted successfully' });
  } catch (error) {
    console.error('DELETE /api/admin/practices/[id] error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
