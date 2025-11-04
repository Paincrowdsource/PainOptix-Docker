/** @type {import('next').NextConfig} */

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
      script-src 'self' 'unsafe-inline' 'unsafe-eval' https://js.stripe.com https://checkout.stripe.com https://www.googletagmanager.com;
      style-src 'self' 'unsafe-inline' https://fonts.googleapis.com;
      font-src 'self' https://fonts.gstatic.com;
      img-src 'self' data: https: blob: https://www.google-analytics.com;
      connect-src 'self' https://*.supabase.co https://api.stripe.com https://checkout.stripe.com https://www.google-analytics.com https://region1.google-analytics.com https://*.analytics.google.com;
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

  webpack: (config, { dev }) => {
    // Disable persistent cache during Playwright E2E tests to avoid OneDrive rename errors
    if (dev && process.env.PLAYWRIGHT) {
      config.cache = false;
    }
    return config;
  },

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