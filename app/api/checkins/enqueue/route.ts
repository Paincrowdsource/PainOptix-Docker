import { NextRequest, NextResponse } from 'next/server';
import { enqueueCheckinsForAssessment } from '@/lib/checkins/enqueue';
import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs';
import { cookies } from 'next/headers';

export async function POST(request: NextRequest) {
  try {
    // Check authentication
    let isAuthenticated = false;
    let isAdmin = false;

    // Method 1: Try Supabase Auth first
    const cookieStore = await cookies();
    const supabase = createRouteHandlerClient({ cookies: () => cookieStore });
    const { data: { session } } = await supabase.auth.getSession();

    if (session?.user) {
      // Check if user has admin role
      const { data: profile } = await supabase
        .from('profiles')
        .select('user_role')
        .eq('id', session.user.id)
        .single();

      if (profile?.user_role === 'admin') {
        isAuthenticated = true;
        isAdmin = true;
      }
    }

    // Method 2: Check for admin password header as fallback
    if (!isAuthenticated) {
      const authHeader = request.headers.get('x-admin-password');
      const adminPassword = process.env.ADMIN_PASSWORD;

      if (authHeader && adminPassword && authHeader === adminPassword) {
        isAuthenticated = true;
        isAdmin = true;
      }
    }

    // Method 3: Check for service role key in dev/staging
    if (!isAuthenticated && process.env.NODE_ENV !== 'production') {
      const authHeader = request.headers.get('authorization');
      const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

      if (authHeader && serviceKey && authHeader === `Bearer ${serviceKey}`) {
        isAuthenticated = true;
        isAdmin = true;
      }
    }

    // If still not authenticated, return 401
    if (!isAuthenticated || !isAdmin) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    // Get assessment ID from request body
    const { assessment_id } = await request.json();

    if (!assessment_id) {
      return NextResponse.json(
        { error: 'assessment_id is required' },
        { status: 400 }
      );
    }

    // Enqueue check-ins
    const result = await enqueueCheckinsForAssessment(assessment_id);

    return NextResponse.json(result);
  } catch (error: any) {
    console.error('Enqueue API error:', error);
    return NextResponse.json(
      { error: error.message || 'Internal server error' },
      { status: 500 }
    );
  }
}