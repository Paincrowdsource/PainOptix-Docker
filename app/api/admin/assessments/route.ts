import { NextRequest, NextResponse } from 'next/server';
import { getServiceSupabase } from '@/lib/supabase';
import { verifyAdminAuth } from '@/lib/auth/admin';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

export async function GET(request: NextRequest) {
  try {
    // Verify admin authentication (supports session or password header)
    const { isAuthenticated, isAdmin, error } = await verifyAdminAuth(request);

    if (!isAuthenticated || !isAdmin) {
      return NextResponse.json(
        { error: error || 'Unauthorized' },
        { status: 401 }
      );
    }

    // Use service role client to bypass RLS
    const supabaseService = getServiceSupabase();

    const { data, error: dbError } = await supabaseService
      .from('assessments')
      .select(`
        *,
        guide_deliveries (*)
      `)
      .order('created_at', { ascending: false });

    if (dbError) {
      console.error('Error fetching assessments:', dbError);
      return NextResponse.json({ error: dbError.message }, { status: 500 });
    }

    // Return with aggressive no-cache headers to prevent stale data
    return NextResponse.json(
      { assessments: data || [] },
      {
        headers: {
          'Cache-Control': 'no-store, no-cache, must-revalidate, proxy-revalidate, max-age=0',
          'Pragma': 'no-cache',
          'Expires': '0'
        }
      }
    );
  } catch (error) {
    console.error('API error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      {
        status: 500,
        headers: {
          'Cache-Control': 'no-store, no-cache, must-revalidate, max-age=0',
        }
      }
    );
  }
}