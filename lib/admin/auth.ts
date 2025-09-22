import { NextRequest } from 'next/server'
import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs'
import { cookies } from 'next/headers'

export async function isAdminRequest(request: NextRequest): Promise<boolean> {
  let isAuthenticated = false
  let isAdmin = false

  try {
    const cookieStore = await cookies()
    const supabase = createRouteHandlerClient({ cookies: () => cookieStore })
    const {
      data: { session },
    } = await supabase.auth.getSession()

    if (session?.user) {
      const { data: profile } = await supabase
        .from('profiles')
        .select('user_role')
        .eq('id', session.user.id)
        .maybeSingle()

      if (profile?.user_role === 'admin') {
        isAuthenticated = true
        isAdmin = true
      }
    }
  } catch (error) {
    console.warn('Admin auth via Supabase failed', error)
  }

  if (!isAuthenticated) {
    const adminPassword = process.env.ADMIN_PASSWORD?.trim()
    const headerPassword = request.headers.get('x-admin-password')?.trim()
    if (adminPassword && headerPassword && adminPassword === headerPassword) {
      isAuthenticated = true
      isAdmin = true
    }
  }

  if (!isAuthenticated && process.env.NODE_ENV !== 'production') {
    const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY?.trim()
    const authHeader = request.headers.get('authorization')?.trim()
    if (serviceKey && authHeader && authHeader === `Bearer ${serviceKey}`) {
      isAuthenticated = true
      isAdmin = true
    }
  }

  return Boolean(isAuthenticated && isAdmin)
}
