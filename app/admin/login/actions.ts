'use server';

import { revalidatePath } from 'next/cache';
import { redirect } from 'next/navigation';
import { createSupabaseServerClient } from '@/lib/supabase-ssr';
import { setAdminSession } from '@/lib/auth/server-admin';
import { randomUUID } from 'crypto';

export interface LoginResult {
  success: boolean;
  error?: string;
}

export async function loginAdminAction(email: string, password: string): Promise<LoginResult> {
  const requestId = randomUUID();

  try {
    // Create Supabase server client
    const supabase = await createSupabaseServerClient();

    // Log login attempt
    console.log(JSON.stringify({
      evt: 'admin_login_attempt',
      rid: requestId,
      timestamp: new Date().toISOString(),
      email: email?.substring(0, 3) + '***', // Partial email for security
    }));

    // Sign in with Supabase
    const { data, error: signInError } = await supabase.auth.signInWithPassword({
      email: email || 'drbcarpentier@gmail.com',
      password: password,
    });

    if (signInError) {
      console.log(JSON.stringify({
        evt: 'admin_login_attempt',
        ok: false,
        rid: requestId,
        reason: 'invalid_credentials',
      }));
      return { success: false, error: 'Invalid credentials. Please check your email and password.' };
    }

    // Check if user has admin role
    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .select('user_role')
      .eq('id', data.user.id)
      .single();

    if (profileError || profile?.user_role !== 'admin') {
      // Sign out non-admin user
      await supabase.auth.signOut();

      console.log(JSON.stringify({
        evt: 'admin_login_attempt',
        ok: false,
        rid: requestId,
        reason: 'insufficient_privileges',
        userId: data.user.id,
      }));

      return { success: false, error: 'Access denied. Admin privileges required.' };
    }

    // Success - log and redirect
    console.log(JSON.stringify({
      evt: 'admin_login_attempt',
      ok: true,
      rid: requestId,
      userId: data.user.id,
    }));

    // Set admin session cookie for faster auth checks
    await setAdminSession();

    // Revalidate admin routes to ensure fresh data
    revalidatePath('/admin');

    // Redirect to dashboard - this is the proper App Router pattern
    redirect('/admin/dashboard');

  } catch (err) {
    console.error(JSON.stringify({
      evt: 'admin_login_attempt',
      ok: false,
      rid: requestId,
      error: err instanceof Error ? err.message : 'unknown_error',
    }));

    // Check if this is a redirect (which is expected)
    if (err && typeof err === 'object' && 'digest' in err && String(err.digest).startsWith('NEXT_REDIRECT')) {
      // This is a successful redirect, re-throw it
      throw err;
    }

    return { success: false, error: 'An error occurred. Please try again.' };
  }
}
