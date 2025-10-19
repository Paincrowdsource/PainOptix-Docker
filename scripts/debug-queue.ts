import { config } from 'dotenv';
import { resolve } from 'path';
config({ path: resolve(__dirname, '../.env.local') });

import { getServiceSupabase } from '../lib/supabase';

async function debugQueue() {
  const supabase = getServiceSupabase();

  console.log('=== Checking check_in_queue ===');
  const { data: queue, error: queueError } = await supabase
    .from('check_in_queue')
    .select('*')
    .order('due_at', { ascending: false })
    .limit(5);

  if (queueError) {
    console.error('Queue error:', queueError);
  } else {
    console.log('Queue items:', queue?.length || 0);
    queue?.forEach(item => {
      console.log(`  - ID: ${item.id.substring(0, 8)}, Assessment: ${item.assessment_id?.substring(0, 8)}, Status: ${item.status}, Day: ${item.day}`);
    });
  }

  if (queue && queue.length > 0) {
    console.log('\n=== Checking assessments for these queue items ===');
    const assessmentIds = queue.map(item => item.assessment_id);

    const { data: assessments, error: assessError } = await supabase
      .from('assessments')
      .select('id, email, phone_number')
      .in('id', assessmentIds);

    if (assessError) {
      console.error('Assessments error:', assessError);
    } else {
      console.log('Assessments found:', assessments?.length || 0);
      assessments?.forEach(assessment => {
        console.log(`  - ID: ${assessment.id.substring(0, 8)}, Email: ${assessment.email || 'NULL'}, Phone: ${assessment.phone || 'NULL'}, Email_Phone: ${assessment.email_phone || 'NULL'}`);
      });
    }
  }

  console.log('\n=== Checking assessments table structure ===');
  const { data: sample, error: sampleError } = await supabase
    .from('assessments')
    .select('*')
    .limit(1);

  if (sampleError) {
    console.error('Sample error:', sampleError);
  } else if (sample && sample.length > 0) {
    console.log('Assessment columns:', Object.keys(sample[0]));
  }
}

debugQueue().catch(console.error);
