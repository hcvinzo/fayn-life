/**
 * Admin Practices API Routes
 * Admin endpoints for managing practices
 */

import { NextRequest, NextResponse } from 'next/server';
import { practiceRepository } from '@/lib/repositories/practice-repository';
import { createPracticeSchema } from '@/lib/validators/practice';
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
 * GET /api/admin/practices
 * Get all practices with optional filters
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
    const search = searchParams.get('search') || undefined;
    const status = searchParams.get('status') || undefined;

    const practices = await practiceRepository.findAllWithFilters(search, status);

    return NextResponse.json(practices);
  } catch (error) {
    console.error('GET /api/admin/practices error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

/**
 * POST /api/admin/practices
 * Create a new practice
 */
export async function POST(request: NextRequest) {
  try {
    // Check admin access
    const { authorized, error } = await checkAdminAccess();
    if (!authorized) {
      return NextResponse.json({ error }, { status: error === 'Unauthorized' ? 401 : 403 });
    }

    const body = await request.json();

    // Validate input
    const validated = createPracticeSchema.parse(body);

    const practice = await practiceRepository.createPractice({
      name: validated.name,
      address: validated.address || null,
      phone: validated.phone || null,
      email: validated.email || null,
      status: validated.status || 'active',
    });

    return NextResponse.json(practice, { status: 201 });
  } catch (error) {
    console.error('POST /api/admin/practices error:', error);

    if (error instanceof Error && error.name === 'ZodError') {
      return NextResponse.json({ error: 'Invalid input' }, { status: 400 });
    }

    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
