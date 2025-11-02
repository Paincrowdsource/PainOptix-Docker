import { redirect } from 'next/navigation'
import { verifyServerAdminAuth, requireAdminAuth } from '@/lib/auth/server-admin'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Shield } from 'lucide-react'
import LoginForm from './LoginForm'

/**
 * Admin Login Page - Server Component
 *
 * This page is server-rendered and uses Server Actions for authentication.
 * The login form is a separate Client Component for interactivity.
 */
export default async function AdminLoginPage() {
  // Check if already authenticated - if so, redirect to dashboard
  const isAuthenticated = await requireAdminAuth()

  if (isAuthenticated) {
    redirect('/admin/dashboard')
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <Card className="w-full max-w-md">
        <CardHeader className="space-y-1">
          <div className="flex items-center justify-center mb-4">
            <Shield className="h-12 w-12 text-primary" />
          </div>
          <CardTitle className="text-2xl text-center">Admin Access</CardTitle>
          <CardDescription className="text-center">
            Enter your admin password to access the PainOptix admin dashboard
          </CardDescription>
        </CardHeader>
        <CardContent>
          <LoginForm />
          <div className="mt-4 text-center text-sm text-gray-600">
            <p>Secure admin area. All access is logged.</p>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
