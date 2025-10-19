#!/usr/bin/env node

/**
 * Safe build wrapper that allows builds to succeed even without required env vars.
 * This enables the checkins-dispatcher job component to build successfully.
 *
 * If required env vars are missing, we skip the Next.js build and exit cleanly.
 * The job doesn't need the Next.js app built - it only needs to run dispatch scripts.
 */

const requiredEnvVars = [
  'NEXT_PUBLIC_SUPABASE_URL',
  'SUPABASE_SERVICE_ROLE_KEY'
];

const missingVars = requiredEnvVars.filter(varName => !process.env[varName]);

if (missingVars.length > 0) {
  console.log('ℹ️  Skipping Next.js build - running in job context without full env config');
  console.log('   Missing vars:', missingVars.join(', '));
  console.log('   This is expected for checkins-dispatcher job component');
  process.exit(0); // Exit successfully
}

// If we have all required vars, proceed with normal build
console.log('✅ All required env vars present - proceeding with Next.js build');
process.exit(1); // Exit with error to trigger the || next build in package.json
