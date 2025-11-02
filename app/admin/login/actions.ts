'use server'

import { verifyServerAdminAuth } from '@/lib/auth/server-admin'

/**
 * Server Action: Login with admin password
 *
 * This function runs ONLY on the server - the password is never exposed to the client.
 * Sets an httpOnly cookie on successful authentication.
 *
 * @param password - Admin password to verify
 * @returns { success: boolean, error?: string }
 */
export async function loginAction(password: string): Promise<{
  success: boolean
  error?: string
}> {
  try {
    const result = await verifyServerAdminAuth(password)

    if (result.isAuthenticated) {
      // Cookie was set by verifyServerAdminAuth
      return { success: true }
    } else {
      return {
        success: false,
        error: result.error || 'Authentication failed'
      }
    }
  } catch (error) {
    console.error('Login action error:', error)
    return {
      success: false,
      error: 'An unexpected error occurred'
    }
  }
}
