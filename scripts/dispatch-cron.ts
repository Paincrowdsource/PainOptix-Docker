#!/usr/bin/env node

/**
 * Check-ins Dispatcher Cron Job
 * Called by DigitalOcean scheduled job every 10 minutes
 * Sends POST request to dispatcher endpoint with authentication token
 */

async function main() {
  const APP_BASE_URL = process.env.APP_BASE_URL;
  const CHECKINS_DISPATCH_TOKEN = process.env.CHECKINS_DISPATCH_TOKEN;
  const DRY_RUN = process.env.DRY_RUN || '1'; // Default to dry run

  // Validate required environment variables
  if (!APP_BASE_URL) {
    console.error('ERROR: APP_BASE_URL environment variable is required');
    process.exit(1);
  }

  if (!CHECKINS_DISPATCH_TOKEN) {
    console.error('ERROR: CHECKINS_DISPATCH_TOKEN environment variable is required');
    process.exit(1);
  }

  const url = `${APP_BASE_URL}/api/checkins/dispatch?dryRun=${DRY_RUN}`;

  console.log(`[Dispatch] Starting check-in dispatcher`);
  console.log(`[Dispatch] URL: ${url}`);
  console.log(`[Dispatch] Mode: ${DRY_RUN === '1' ? 'DRY RUN' : 'LIVE'}`);
  console.log(`[Dispatch] Time: ${new Date().toISOString()}`);

  try {
    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-Dispatch-Token': CHECKINS_DISPATCH_TOKEN
      },
      body: JSON.stringify({ limit: 100 })
    });

    const statusCode = response.status;

    if (response.ok) {
      const data = await response.json();
      console.log(`[Dispatch] Success (${statusCode}):`);
      console.log(`  Queued: ${data.queued || 0}`);
      console.log(`  Sent: ${data.sent || 0}`);
      console.log(`  Skipped: ${data.skipped || 0}`);
      console.log(`  Failed: ${data.failed || 0}`);

      if (data.errors && data.errors.length > 0) {
        console.warn(`[Dispatch] Errors encountered:`);
        data.errors.forEach((err: string) => console.warn(`  - ${err}`));
      }

      process.exit(0);
    } else {
      const errorText = await response.text();
      console.error(`[Dispatch] Failed (${statusCode}): ${errorText}`);
      process.exit(1);
    }
  } catch (error: any) {
    console.error(`[Dispatch] Network error: ${error.message}`);
    process.exit(1);
  }
}

// Run if executed directly
if (require.main === module) {
  main().catch(error => {
    console.error('[Dispatch] Fatal error:', error);
    process.exit(1);
  });
}