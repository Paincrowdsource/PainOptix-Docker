import { NextRequest, NextResponse } from 'next/server';
import { getServiceSupabase } from '@/lib/supabase';
import { createSupabaseRouteHandlerClient } from '@/lib/supabase-ssr';
import { deliverEducationalGuide } from '@/lib/guide-delivery';

export const dynamic = 'force-dynamic';

/**
 * POST /api/admin/retry-sms
 *
 * Manually retry SMS delivery for a specific assessment.
 * Used to recover Bug 2 users who have valid phone numbers but never received SMS.
 *
 * Body: { assessmentId: string }
 */
export async function POST(request: NextRequest) {
  try {
    // Auth check (same pattern as other admin endpoints)
    const { supabase } = await createSupabaseRouteHandlerClient(request);
    const { data: { session } } = await supabase.auth.getSession();

    let isAuthenticated = false;
    let isAdmin = false;

    if (session?.user) {
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

    // Fallback to password auth
    if (!isAuthenticated) {
      const authHeader = request.headers.get('x-admin-password');
      const adminPassword = process.env.ADMIN_PASSWORD;

      if (authHeader && adminPassword && authHeader === adminPassword) {
        isAuthenticated = true;
        isAdmin = true;
      }
    }

    if (!isAuthenticated || !isAdmin) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Parse request body
    const body = await request.json();
    const { assessmentId } = body;

    if (!assessmentId) {
      return NextResponse.json(
        { error: 'assessmentId is required' },
        { status: 400 }
      );
    }

    // Verify assessment exists and has phone number
    const supabaseService = getServiceSupabase();
    const { data: assessment, error: assessmentError } = await supabaseService
      .from('assessments')
      .select('id, phone_number, email, sms_opt_in, delivery_method')
      .eq('id', assessmentId)
      .single();

    if (assessmentError || !assessment) {
      return NextResponse.json(
        { error: 'Assessment not found' },
        { status: 404 }
      );
    }

    if (!assessment.phone_number) {
      return NextResponse.json(
        { error: 'Assessment has no phone number - cannot send SMS' },
        { status: 400 }
      );
    }

    // Check if SMS was already sent
    const { data: existingSmsLogs } = await supabaseService
      .from('communication_logs')
      .select('id, status, created_at')
      .eq('assessment_id', assessmentId)
      .eq('channel', 'sms');

    console.log('[Admin] Retrying SMS for assessment:', {
      assessmentId,
      phone: assessment.phone_number,
      existingSmsLogs: existingSmsLogs?.length || 0
    });

    // Trigger delivery with forceSms
    const result = await deliverEducationalGuide(assessmentId, { forceSms: true });

    return NextResponse.json({
      success: true,
      assessmentId,
      phone: assessment.phone_number,
      deliveryResult: result,
      previousSmsAttempts: existingSmsLogs?.length || 0
    });

  } catch (error: any) {
    console.error('[Admin] Retry SMS error:', error);
    return NextResponse.json(
      { error: error.message || 'Internal server error' },
      { status: 500 }
    );
  }
}
