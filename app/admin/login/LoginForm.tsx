'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { AlertCircle } from 'lucide-react'
import { loginAction } from './actions'

/**
 * Login Form - Client Component
 *
 * Handles user interaction and calls Server Action for authentication.
 * The actual auth logic is server-side only - this component never sees the password after submission.
 */
export default function LoginForm() {
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const router = useRouter()

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    setLoading(true)

    try {
      // Call Server Action to verify password and set cookie
      const result = await loginAction(password)

      if (result.success) {
        // Server Action set the cookie successfully
        // Redirect to dashboard
        router.push('/admin/dashboard')
        router.refresh()
      } else {
        setError(result.error || 'Invalid password. Please try again.')
      }
    } catch (err) {
      console.error('Login error:', err)
      setError('An error occurred. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      {error && (
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      <div className="space-y-2">
        <label htmlFor="password" className="text-sm font-medium">
          Admin Password
        </label>
        <Input
          id="password"
          type="password"
          placeholder="Enter admin password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          required
          disabled={loading}
          autoComplete="current-password"
        />
      </div>

      <Button
        type="submit"
        className="w-full"
        disabled={loading || !password}
      >
        {loading ? 'Signing in...' : 'Sign In'}
      </Button>
    </form>
  )
}
