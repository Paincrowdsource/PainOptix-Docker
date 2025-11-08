import { NextRequest, NextResponse } from 'next/server';
import { createSupabaseServerClient } from '@/lib/supabase-ssr';
import { getAdminSession } from '@/lib/auth/server-admin';
import { headers } from 'next/headers';

export const dynamic = 'force-dynamic';

/**
 * Admin Session Diagnostic Endpoint
 *
 * Helps diagnose why a user can't access the admin dashboard
 *
 * Security: Requires x-admin-password header
 */
export async function GET(request: NextRequest) {
  try {
    // Verify admin password header
    const headersList = await headers();
    const adminPassword = headersList.get('x-admin-password');

    if (!adminPassword || adminPassword !== process.env.ADMIN_PASSWORD) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    // Get Supabase session
    const supabase = await createSupabaseServerClient();
    const { data: { user }, error: userError } = await supabase.auth.getUser();

    // Get admin session cookie
    const hasAdminCookie = await getAdminSession();

    // Get user profile if authenticated
    let profile = null;
    if (user) {
      const { data: profileData } = await supabase
        .from('profiles')
        .select('user_role')
        .eq('id', user.id)
        .single();
      profile = profileData;
    }

    // Get user agent for debugging
    const userAgent = headersList.get('user-agent') || 'unknown';
    const isSafari = userAgent.toLowerCase().includes('safari') && !userAgent.toLowerCase().includes('chrome');
    const isFirefox = userAgent.toLowerCase().includes('firefox');

    return NextResponse.json({
      timestamp: new Date().toISOString(),
      session: {
        hasSupabaseSession: !!user,
        userId: user?.id || null,
        email: user?.email || null,
        hasAdminCookie,
        profileRole: profile?.user_role || null,
        isAdmin: profile?.user_role === 'admin',
      },
      browser: {
        userAgent,
        isSafari,
        isFirefox,
        likelyThirdPartyCookiesBlocked: isSafari || isFirefox,
      },
      diagnostics: {
        canAccessDashboard: hasAdminCookie || (!!user && profile?.user_role === 'admin'),
        authMethod: hasAdminCookie ? 'admin-cookie' : (user && profile?.user_role === 'admin' ? 'supabase' : 'none'),
        recommendations: getRecommendations(!!user, hasAdminCookie, profile?.user_role, userAgent),
      },
      supabaseError: userError?.message || null,
    });

  } catch (error) {
    console.error('Debug session error:', error);
    return NextResponse.json(
      {
        error: 'Internal server error',
        message: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}

function getRecommendations(hasUser: boolean, hasAdminCookie: boolean, userRole: string | null, userAgent: string): string[] {
  const recommendations: string[] = [];

  if (!hasUser && !hasAdminCookie) {
    recommendations.push('No authentication detected. User needs to log in.');
  }

  if (hasUser && userRole !== 'admin') {
    recommendations.push('User is authenticated but does not have admin role in profiles table.');
  }

  if (hasUser && userRole === 'admin' && !hasAdminCookie) {
    recommendations.push('Supabase session exists with admin role, but admin-session cookie is missing.');
    recommendations.push('This suggests the login page is not calling setAdminSession().');
  }

  const isSafari = userAgent.toLowerCase().includes('safari') && !userAgent.toLowerCase().includes('chrome');
  const isFirefox = userAgent.toLowerCase().includes('firefox');

  if (isSafari) {
    recommendations.push('Safari detected: ITP (Intelligent Tracking Prevention) may block third-party cookies.');
    recommendations.push('Ensure NEXT_PUBLIC_APP_URL matches the domain being accessed.');
  }

  if (isFirefox) {
    recommendations.push('Firefox detected: Enhanced Tracking Protection may block third-party cookies.');
    recommendations.push('User should check if Enhanced Tracking Protection is enabled for this site.');
  }

  if (!hasAdminCookie) {
    recommendations.push('Admin cookie is missing. Login page should use server action to set admin-session cookie.');
  }

  return recommendations;
}
