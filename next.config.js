/** @type {import('next').NextConfig} */

// Allow builds to succeed even without certain env vars
// This enables the checkins-dispatcher job to build without full env config
if (!process.env.NEXT_PUBLIC_SUPABASE_URL) {
  console.warn('⚠️  Building without Supabase env vars - using placeholders for build only');
  process.env.NEXT_PUBLIC_SUPABASE_URL = 'https://placeholder.supabase.co';
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY = 'placeholder-anon-key';
  process.env.SUPABASE_SERVICE_ROLE_KEY = 'placeholder-service-role-key';
  process.env.STRIPE_SECRET_KEY = 'sk_test_placeholder';
  process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY = 'pk_test_placeholder';
}

// Security headers
const securityHeaders = [
  {
    key: 'X-DNS-Prefetch-Control',
    value: 'on'
  },
  {
    key: 'X-XSS-Protection',
    value: '1; mode=block'
  },
  {
    key: 'X-Frame-Options',
    value: 'SAMEORIGIN'
  },
  {
    key: 'X-Content-Type-Options',
    value: 'nosniff'
  },
  {
    key: 'Referrer-Policy',
    value: 'origin-when-cross-origin'
  },
  {
    key: 'Strict-Transport-Security',
    value: 'max-age=31536000; includeSubDomains'
  },
  {
    key: 'Permissions-Policy',
    value: 'camera=(), microphone=(), geolocation=()'
  },
  {
    key: 'Content-Security-Policy',
    value: `
      default-src 'self';
      script-src 'self' 'unsafe-inline' 'unsafe-eval' https://js.stripe.com https://checkout.stripe.com;
      style-src 'self' 'unsafe-inline' https://fonts.googleapis.com;
      font-src 'self' https://fonts.gstatic.com;
      img-src 'self' data: https: blob:;
      connect-src 'self' https://*.supabase.co https://api.stripe.com https://checkout.stripe.com;
      frame-src 'self' https://js.stripe.com https://checkout.stripe.com;
      object-src 'none';
      base-uri 'self';
      form-action 'self';
      frame-ancestors 'none';
      upgrade-insecure-requests;
    `.replace(/\s{2,}/g, ' ').trim()
  }
]

const nextConfig = {
  reactStrictMode: true,
  poweredByHeader: false, // Remove X-Powered-By header
  output: 'standalone', // For Docker deployment
  
  async headers() {
    return [
      {
        // Apply these headers to all routes
        source: '/:path*',
        headers: securityHeaders,
      },
    ]
  },
}

module.exports = nextConfig