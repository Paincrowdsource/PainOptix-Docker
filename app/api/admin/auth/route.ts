export const dynamic = 'force-dynamic'
import { NextRequest, NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { supabaseAdmin } from '@/lib/supabase-admin';

export async function POST(request: NextRequest) {
  const supabase = supabaseAdmin();
  try {
    const { userId, email } = await request.json();
    const cookieStore = await cookies();

    // Verify admin role using admin client (doesn't require auth cookies)
    // Removed duplicate: // Duplicate removed: const supabase = supabaseAdmin();
    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .select('user_role, email')
      .eq('id', userId)
      .single();

    if (profileError) {
      return NextResponse.json({ error: 'Failed to verify admin role' }, { status: 401 });
    }

    if (!profile || profile.user_role !== 'admin') {
      return NextResponse.json({ error: 'Unauthorized - Admin access required' }, { status: 401 });
    }

    // Verify email matches
    if (profile.email !== email) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Set admin cookie for legacy compatibility
    cookieStore.set('admin-authenticated', 'true', {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 60 * 60 * 24 // 24 hours
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}