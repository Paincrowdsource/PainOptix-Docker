/**
 * Diagnostic endpoint to identify deployed app and build
 * Read-only, no authentication required
 */
export async function GET() {
  return new Response(
    JSON.stringify({
      app: process.env.APP_NAME || process.env.DO_APP_NAME || 'painoptix-clean',
      build: process.env.NEXT_PUBLIC_BUILD_STAMP || 'n/a',
      env: process.env.NODE_ENV || 'production',
      timestamp: new Date().toISOString(),
    }),
    {
      status: 200,
      headers: {
        'Content-Type': 'application/json',
        'Cache-Control': 'no-store, no-cache, must-revalidate',
        'X-Build-Stamp': process.env.NEXT_PUBLIC_BUILD_STAMP || 'n/a',
      },
    }
  )
}
