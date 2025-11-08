import { NextRequest, NextResponse } from 'next/server';
import { getServiceSupabase } from '@/lib/supabase';
import { createSupabaseRouteHandlerClient } from '@/lib/supabase-ssr';

export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  try {
    // Method 1: Try Supabase Auth first
    const { supabase } = await createSupabaseRouteHandlerClient(request);

    // Check if user is authenticated
    const { data: { session }, error: authError } = await supabase.auth.getSession();
    
    let isAuthenticated = false;
    let isAdmin = false;
    
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
    
    // Method 2: Fallback to simple password check if Supabase auth fails
    if (!isAuthenticated) {
      // Check for admin password in header as fallback
      const authHeader = request.headers.get('x-admin-password');
      const adminPassword = process.env.ADMIN_PASSWORD;
      
      if (authHeader && adminPassword && authHeader === adminPassword) {
        isAuthenticated = true;
        isAdmin = true;
      }
    }
    
    // If still not authenticated, return 401
    if (!isAuthenticated || !isAdmin) {
      console.log('Authentication failed:', {
        hasSession: !!session,
        hasUser: !!session?.user,
        isAdmin,
        hasAuthHeader: !!request.headers.get('x-admin-password')
      });
      return NextResponse.json({ 
        error: 'Unauthorized',
        debug: {
          hasSession: !!session,
          hasUser: !!session?.user,
          sessionEmail: session?.user?.email
        }
      }, { status: 401 });
    }

    // Use service role client to bypass RLS
    const supabaseService = getServiceSupabase();

    // Step 1: Fetch assessments
    const { data: assessments, error } = await supabaseService
      .from('v_assessments_visible')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Error fetching assessments:', error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    // Step 2: Fetch guide deliveries for these assessments
    const assessmentIds = assessments?.map(a => a.id) || []
    let guideDeliveriesMap: Record<string, any[]> = {}

    if (assessmentIds.length > 0) {
      const { data: guideDeliveries } = await supabaseService
        .from('v_guide_deliveries_visible')
        .select('*')
        .in('assessment_id', assessmentIds)

      // Group by assessment_id
      guideDeliveriesMap = (guideDeliveries || []).reduce((acc, delivery) => {
        if (!acc[delivery.assessment_id]) {
          acc[delivery.assessment_id] = []
        }
        acc[delivery.assessment_id].push(delivery)
        return acc
      }, {} as Record<string, any[]>)
    }

    // Step 3: Enrich assessments with guide_deliveries
    const enrichedAssessments = (assessments || []).map(assessment => ({
      ...assessment,
      guide_deliveries: guideDeliveriesMap[assessment.id] || []
    }))

    return NextResponse.json({ assessments: enrichedAssessments });
  } catch (error) {
    console.error('API error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}