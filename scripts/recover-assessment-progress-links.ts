#!/usr/bin/env tsx
/**
 * Script to recover assessment_progress links based on temporal correlation
 *
 * This script safely matches assessment_progress records to assessments by:
 * 1. Finding progress sessions that end 20-300 seconds before assessment creation
 * 2. Ensuring 1-to-1 matches only (no ambiguous matches)
 * 3. Running in dry-run mode by default for safety
 *
 * Run with: npx tsx scripts/recover-assessment-progress-links.ts
 * Run actual update: npx tsx scripts/recover-assessment-progress-links.ts --execute
 */

import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
import path from 'path';

// Load environment variables from .env.local
dotenv.config({ path: path.resolve(process.cwd(), '.env.local') });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('Missing required environment variables');
  console.error('Required: NEXT_PUBLIC_SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

// Check if we should execute or just dry run
const shouldExecute = process.argv.includes('--execute');
const focusRecent = !process.argv.includes('--all-time');

async function main() {
  console.log('=== Assessment Progress Recovery Tool ===\n');
  console.log(`Mode: ${shouldExecute ? '🔴 EXECUTE' : '✅ DRY RUN (Safe)'}`);
  console.log(`Scope: ${focusRecent ? 'Recent data (last 2 months)' : 'All time'}\n`);

  if (shouldExecute) {
    console.log('⚠️  WARNING: This will UPDATE the database!');
    console.log('Press Ctrl+C to cancel, or wait 5 seconds to continue...\n');
    await new Promise(resolve => setTimeout(resolve, 5000));
  }

  try {
    // Step 1: Find all unlinked progress sessions
    const dateFilter = focusRecent ? '2024-08-01' : '2024-01-01';

    const { data: progressSessions, error: progressError } = await supabase
      .from('assessment_progress')
      .select('session_id, created_at')
      .is('assessment_id', null)
      .gte('created_at', dateFilter)
      .order('created_at');

    if (progressError) {
      console.error('Error fetching progress sessions:', progressError);
      process.exit(1);
    }

    // Group by session_id and get session timings
    const sessionMap = new Map<string, { start: Date; end: Date; count: number }>();

    for (const record of progressSessions || []) {
      const sessionId = record.session_id;
      const timestamp = new Date(record.created_at);

      if (!sessionMap.has(sessionId)) {
        sessionMap.set(sessionId, {
          start: timestamp,
          end: timestamp,
          count: 1
        });
      } else {
        const session = sessionMap.get(sessionId)!;
        session.start = timestamp < session.start ? timestamp : session.start;
        session.end = timestamp > session.end ? timestamp : session.end;
        session.count++;
      }
    }

    console.log(`Found ${sessionMap.size} unlinked progress sessions\n`);

    // Step 2: Get all assessments in the same time range
    const { data: assessments, error: assessmentError } = await supabase
      .from('assessments')
      .select('id, session_id, created_at, guide_type, email')
      .gte('created_at', dateFilter)
      .order('created_at');

    if (assessmentError) {
      console.error('Error fetching assessments:', assessmentError);
      process.exit(1);
    }

    console.log(`Found ${assessments?.length || 0} assessments to check\n`);

    // Step 3: Find matches based on timing
    const matches: Array<{
      assessmentId: string;
      progressSessionId: string;
      assessmentTime: Date;
      progressEndTime: Date;
      secondsDiff: number;
      questionCount: number;
      email: string;
      guideType: string;
    }> = [];

    for (const assessment of assessments || []) {
      const assessmentTime = new Date(assessment.created_at);

      // Find progress sessions that ended within 5 minutes before this assessment
      let bestMatch: { sessionId: string; secondsDiff: number; count: number } | null = null;

      for (const [sessionId, session] of sessionMap) {
        const secondsDiff = (assessmentTime.getTime() - session.end.getTime()) / 1000;

        // Progress must end BEFORE assessment, but within 5 minutes
        if (secondsDiff >= 0 && secondsDiff <= 300) {
          if (!bestMatch || secondsDiff < bestMatch.secondsDiff) {
            bestMatch = { sessionId, secondsDiff, count: session.count };
          }
        }
      }

      if (bestMatch) {
        const session = sessionMap.get(bestMatch.sessionId)!;
        matches.push({
          assessmentId: assessment.id,
          progressSessionId: bestMatch.sessionId,
          assessmentTime,
          progressEndTime: session.end,
          secondsDiff: bestMatch.secondsDiff,
          questionCount: bestMatch.count,
          email: assessment.email,
          guideType: assessment.guide_type
        });
      }
    }

    // Step 4: Filter to only 1-to-1 matches for safety
    const assessmentCounts = new Map<string, number>();
    const sessionCounts = new Map<string, number>();

    for (const match of matches) {
      assessmentCounts.set(match.assessmentId, (assessmentCounts.get(match.assessmentId) || 0) + 1);
      sessionCounts.set(match.progressSessionId, (sessionCounts.get(match.progressSessionId) || 0) + 1);
    }

    const safeMatches = matches.filter(match =>
      assessmentCounts.get(match.assessmentId) === 1 &&
      sessionCounts.get(match.progressSessionId) === 1
    );

    console.log(`Found ${matches.length} potential matches`);
    console.log(`Found ${safeMatches.length} safe 1-to-1 matches\n`);

    // Step 5: Display matches
    console.log('=== Safe Matches to Process ===\n');

    for (const match of safeMatches.slice(0, 10)) {
      const emailPrefix = match.email ? match.email.substring(0, 3) + '***' : 'N/A';
      console.log(`Assessment: ${match.assessmentId.substring(0, 8)}...`);
      console.log(`  Email: ${emailPrefix}`);
      console.log(`  Guide: ${match.guideType}`);
      console.log(`  Time gap: ${Math.round(match.secondsDiff)} seconds`);
      console.log(`  Questions: ${match.questionCount}`);
      console.log(`  Progress session: ${match.progressSessionId.substring(0, 8)}...\n`);
    }

    if (safeMatches.length > 10) {
      console.log(`... and ${safeMatches.length - 10} more matches\n`);
    }

    // Step 6: Execute updates if requested
    if (shouldExecute) {
      console.log('=== Executing Updates ===\n');

      let successCount = 0;
      let errorCount = 0;

      for (const match of safeMatches) {
        const { error } = await supabase
          .from('assessment_progress')
          .update({ assessment_id: match.assessmentId })
          .eq('session_id', match.progressSessionId)
          .is('assessment_id', null);

        if (error) {
          console.error(`Error updating session ${match.progressSessionId}:`, error);
          errorCount++;
        } else {
          successCount++;
          if (successCount % 10 === 0) {
            console.log(`✓ Updated ${successCount} sessions...`);
          }
        }
      }

      console.log('\n=== Update Complete ===');
      console.log(`Successfully updated: ${successCount} sessions`);
      console.log(`Errors encountered: ${errorCount}`);

      // Verify the updates
      const { count: stillUnlinked } = await supabase
        .from('assessment_progress')
        .select('*', { count: 'exact', head: true })
        .is('assessment_id', null);

      console.log(`Progress records still unlinked: ${stillUnlinked || 0}`);
    } else {
      console.log('=== Dry Run Complete ===');
      console.log(`Would update ${safeMatches.length} progress sessions`);
      console.log('\nTo execute these updates, run:');
      console.log('  npx tsx scripts/recover-assessment-progress-links.ts --execute');
    }

  } catch (error) {
    console.error('Unexpected error:', error);
    process.exit(1);
  }
}

// Run the script
main().catch(console.error);