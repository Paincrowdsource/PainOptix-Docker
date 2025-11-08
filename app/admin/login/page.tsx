'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Shield, AlertCircle } from 'lucide-react';
import { loginAdminAction } from './actions';

export default function AdminLoginPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      // Use server action for authentication
      // This sets BOTH Supabase cookies AND admin-session cookie
      const result = await loginAdminAction(email || 'drbcarpentier@gmail.com', password);

      if (!result.success) {
        setError(result.error || 'Login failed');
        setLoading(false);
        return;
      }

      // Server action handles redirect via redirect()
      // If we get here, something went wrong
      setError('Login succeeded but redirect failed. Please try refreshing.');
      setLoading(false);

    } catch (err) {
      // Check if this is a redirect error (which is expected from server actions)
      if (err && typeof err === 'object' && 'digest' in err && String(err.digest).startsWith('NEXT_REDIRECT')) {
        // This is a successful redirect, let it propagate
        throw err;
      }

      console.error('Login error:', err);
      setError('An error occurred. Please try again.');
      setLoading(false);
    }
  };

  // Quick login for Dr. Carpentier
  const handleQuickLogin = () => {
    setEmail('drbcarpentier@gmail.com');
    // Don't pre-fill password for security
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <Card className="w-full max-w-md">
        <CardHeader className="space-y-1">
          <div className="flex items-center justify-center mb-4">
            <Shield className="h-12 w-12 text-primary" />
          </div>
          <CardTitle className="text-2xl text-center">Admin Access</CardTitle>
          <CardDescription className="text-center">
            Sign in to access the PainOptix admin dashboard
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleLogin} className="space-y-4">
            {error && (
              <Alert variant="destructive">
                <AlertCircle className="h-4 w-4" />
                <AlertDescription>{error}</AlertDescription>
              </Alert>
            )}
            
            <div className="space-y-2">
              <label htmlFor="email" className="text-sm font-medium">
                Email
              </label>
              <Input
                id="email"
                type="email"
                placeholder="Enter your admin email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                disabled={loading}
              />
              {!email && (
                <button
                  type="button"
                  onClick={handleQuickLogin}
                  className="text-xs text-blue-600 hover:underline"
                >
                  Use Dr. Carpentier&apos;s email
                </button>
              )}
            </div>

            <div className="space-y-2">
              <label htmlFor="password" className="text-sm font-medium">
                Password
              </label>
              <Input
                id="password"
                type="password"
                placeholder="Enter admin password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                disabled={loading}
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

          <div className="mt-4 text-center text-sm text-gray-600">
            <p>Secure admin area. All access is logged.</p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}