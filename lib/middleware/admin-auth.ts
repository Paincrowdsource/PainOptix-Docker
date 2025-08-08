import { NextRequest, NextResponse } from 'next/server';
import { createServerClient } from '@supabase/ssr';
import { supabaseAdmin } from '@/lib/supabase-admin';
import { logger } from '@/lib/logger';

export interface AdminUser {
  id: string;
  email: string;
  role: string;
}

/**
 * Verify if the current user has admin privileges
 */
export async function verifyAdmin(req: NextRequest): Promise<AdminUser | null> {
  try {
    // Create a server-side Supabase client
    const supabase = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      {
        cookies: {
          get(name: string) {
            return req.cookies.get(name)?.value;
          },
        },
      }
    );

    // Get the current session
    const { data: { session }, error: sessionError } = await supabase.auth.getSession();
    
    if (sessionError || !session) {
      // Check for legacy admin cookie as fallback
      const adminCookie = req.cookies.get('admin-authenticated');
      if (!adminCookie?.value) {
        logger.warn('Admin access attempt without session');
        return null;
      }
      // If we have the legacy cookie but no session, we still need to verify
      // This is a temporary state that shouldn't normally happen
      logger.warn('Legacy admin cookie found without session');
    }

    // If we have a session, verify admin role
    if (session) {
      // Check if user has admin role in profiles table
      const { data: profile, error: profileError } = await supabaseAdmin
        .from('profiles')
        .select('id, user_role, email')
        .eq('id', session.user.id)
        .single();

      if (profileError || !profile || profile.user_role !== 'admin') {
        logger.warn('Non-admin user attempted admin access', {
          userId: session.user.id,
          email: session.user.email
        });
        return null;
      }

      return {
        id: session.user.id,
        email: profile.email || session.user.email || '',
        role: profile.user_role
      };
    }

    // If we only have the legacy cookie, we can't fully verify without a session
    // This should be a temporary state - the user should re-authenticate
    return null;
  } catch (error) {
    logger.error('Error verifying admin access', { error });
    return null;
  }
}

/**
 * Log admin action for audit trail
 */
export async function logAdminAction(
  adminId: string,
  action: string,
  resourceType: string,
  resourceId?: string,
  metadata?: any,
  req?: NextRequest
) {
  try {
    const auditData: any = {
      admin_id: adminId,
      action,
      resource_type: resourceType,
      resource_id: resourceId,
      metadata,
      created_at: new Date().toISOString()
    };

    // Add request metadata if available
    if (req) {
      auditData.ip_address = req.headers.get('x-forwarded-for') || 
                             req.headers.get('x-real-ip') || 
                             'unknown';
      auditData.user_agent = req.headers.get('user-agent') || 'unknown';
    }

    const { error } = await supabaseAdmin
      .from('admin_audit_logs')
      .insert(auditData);

    if (error) {
      logger.error('Failed to log admin action', { error, auditData });
    }
  } catch (error) {
    logger.error('Error logging admin action', { error });
  }
}

/**
 * Middleware function to protect admin routes
 */
export async function adminMiddleware(req: NextRequest) {
  const admin = await verifyAdmin(req);
  
  if (!admin) {
    // Log unauthorized access attempt
    logger.warn('Unauthorized admin access attempt', {
      path: req.nextUrl.pathname,
      method: req.method
    });

    return NextResponse.json(
      { error: 'Unauthorized' },
      { status: 401 }
    );
  }

  // Log successful admin access
  await logAdminAction(
    admin.id,
    'admin_page_access',
    'admin_route',
    undefined,
    { path: req.nextUrl.pathname },
    req
  );

  // Allow the request to proceed
  return null;
}

/**
 * Verify admin authentication for API routes
 */
export async function requireAdminAuth(req: NextRequest): Promise<AdminUser> {
  const admin = await verifyAdmin(req);
  
  if (!admin) {
    throw new Error('Unauthorized');
  }

  return admin;
}