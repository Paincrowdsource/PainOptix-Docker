#!/usr/bin/env tsx
/**
 * Script to backfill missing assessment_id links in assessment_progress table
 * This fixes the discrepancy where progress records exist but aren't linked to assessments
 *
 * Run with: npx tsx scripts/fix-assessment-progress-links.ts
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

async function main() {
  console.log('Starting assessment_progress backfill...\n');

  try {
    // Step 1: Get all assessments with session_ids
    const { data: assessments, error: assessmentError } = await supabase
      .from('assessments')
      .select('id, session_id, created_at, guide_type')
      .order('created_at', { ascending: false });

    if (assessmentError) {
      console.error('Error fetching assessments:', assessmentError);
      process.exit(1);
    }

    console.log(`Found ${assessments?.length || 0} assessments to process\n`);

    // Step 2: Get count of progress records without assessment_id
    const { count: unlinkedCount } = await supabase
      .from('assessment_progress')
      .select('*', { count: 'exact', head: true })
      .is('assessment_id', null);

    console.log(`Found ${unlinkedCount || 0} unlinked progress records\n`);

    // Step 3: Process each assessment
    let successCount = 0;
    let errorCount = 0;
    let alreadyLinkedCount = 0;

    for (const assessment of assessments || []) {
      // Check if this session has any progress records
      const { data: progressRecords, error: progressCheckError } = await supabase
        .from('assessment_progress')
        .select('id')
        .eq('session_id', assessment.session_id)
        .limit(1);

      if (progressCheckError) {
        console.error(`Error checking progress for session ${assessment.session_id}:`, progressCheckError);
        errorCount++;
        continue;
      }

      if (!progressRecords || progressRecords.length === 0) {
        // No progress records for this session
        continue;
      }

      // Check if already linked
      const { data: linkedCheck } = await supabase
        .from('assessment_progress')
        .select('id')
        .eq('session_id', assessment.session_id)
        .not('assessment_id', 'is', null)
        .limit(1);

      if (linkedCheck && linkedCheck.length > 0) {
        alreadyLinkedCount++;
        continue;
      }

      // Update all progress records for this session
      const { error: updateError, count } = await supabase
        .from('assessment_progress')
        .update({ assessment_id: assessment.id })
        .eq('session_id', assessment.session_id)
        .is('assessment_id', null);

      if (updateError) {
        console.error(`Error updating session ${assessment.session_id}:`, updateError);
        errorCount++;
      } else {
        successCount++;
        console.log(`✓ Linked ${count} progress records for assessment ${assessment.id} (${assessment.guide_type})`);
      }
    }

    // Step 4: Final verification
    const { count: stillUnlinked } = await supabase
      .from('assessment_progress')
      .select('*', { count: 'exact', head: true })
      .is('assessment_id', null);

    console.log('\n=== Backfill Complete ===');
    console.log(`Assessments successfully linked: ${successCount}`);
    console.log(`Assessments already linked: ${alreadyLinkedCount}`);
    console.log(`Errors encountered: ${errorCount}`);
    console.log(`Progress records still unlinked: ${stillUnlinked || 0}`);

    if (stillUnlinked && stillUnlinked > 0) {
      console.log('\nNote: Some progress records remain unlinked. These may be from:');
      console.log('- Incomplete assessments that were never submitted');
      console.log('- Test sessions without corresponding assessments');
      console.log('- Sessions where users dropped off before completing');
    }

  } catch (error) {
    console.error('Unexpected error:', error);
    process.exit(1);
  }
}

// Run the script
main().catch(console.error);