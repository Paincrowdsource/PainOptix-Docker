import { NextRequest, NextResponse } from 'next/server';
import { dispatchDue } from '@/lib/checkins/dispatch';
import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs';
import { cookies } from 'next/headers';

export async function POST(request: NextRequest) {
  try {
    // Check authentication
    let isAuthenticated = false;
    let isAdmin = false;

    // Method 1: Check for dispatch token (for scheduled job)
    const dispatchToken = request.headers.get('x-dispatch-token');
    const expectedToken = process.env.CHECKINS_DISPATCH_TOKEN;

    if (dispatchToken && expectedToken && dispatchToken === expectedToken) {
      isAuthenticated = true;
      isAdmin = true;
      console.info('[Dispatch] Authenticated via dispatch token');
    }

    // Method 2: Try Supabase Auth
    if (!isAuthenticated) {
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
    }

    // Method 3: Check for admin password header as fallback
    if (!isAuthenticated) {
      const authHeader = request.headers.get('x-admin-password');
      const adminPassword = process.env.ADMIN_PASSWORD;

      if (authHeader && adminPassword && authHeader === adminPassword) {
        isAuthenticated = true;
        isAdmin = true;
      }
    }

    // Method 4: Check for service role key in dev/staging
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
      console.warn('[Dispatch] Authentication failed');
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    // Check for dryRun query param
    const url = new URL(request.url);
    const dryRun = url.searchParams.get('dryRun') === '1';

    // Get optional limit from request body
    let limit = 100;
    try {
      const body = await request.json();
      if (body.limit && typeof body.limit === 'number') {
        limit = Math.min(body.limit, 1000); // Cap at 1000
      }
    } catch {
      // Body is optional, ignore parse errors
    }

    // Dispatch due messages
    const result = await dispatchDue(limit, { dryRun });

    return NextResponse.json({
      success: true,
      ...result
    });
  } catch (error: any) {
    console.error('Dispatch API error:', error);
    return NextResponse.json(
      { error: error.message || 'Internal server error' },
      { status: 500 }
    );
  }
}