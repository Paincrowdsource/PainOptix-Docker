import { NextRequest, NextResponse } from 'next/server';
import { getServiceSupabase } from '@/lib/supabase';

/**
 * Diagnostic endpoint to test SMS logging to communication_logs
 * This reveals the exact error preventing SMS logs from being written
 *
 * Usage: GET /api/test-sms-log
 */
export async function GET(request: NextRequest) {
  // Only allow in development or with admin password
  const authHeader = request.headers.get('authorization');
  const adminPassword = process.env.ADMIN_PASSWORD;

  if (process.env.NODE_ENV === 'production' && authHeader !== `Bearer ${adminPassword}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const supabase = getServiceSupabase();
  const testId = `test-sms-${Date.now()}`;

  const results: any = {
    timestamp: new Date().toISOString(),
    tests: []
  };

  // Test 1: Try inserting an SMS log entry
  try {
    const smsLogPayload = {
      assessment_id: null, // Use null since we don't have a real assessment
      type: 'test_sms_diagnostic',
      template_key: 'test_sms_diagnostic',
      status: 'sent',
      channel: 'sms',
      provider: 'twilio',
      provider_message_id: `SM${testId}`,
      recipient: 'test-hash-123...',
      subject: null,
      message: 'Test SMS message for diagnostic purposes',
      error_message: null,
      metadata: { diagnostic: true, test_id: testId },
      sent_at: new Date().toISOString(),
      created_at: new Date().toISOString()
    };

    const { data, error } = await supabase
      .from('communication_logs')
      .insert(smsLogPayload)
      .select();

    results.tests.push({
      name: 'SMS Log Insert (null assessment_id)',
      payload: smsLogPayload,
      success: !error,
      data: data,
      error: error ? {
        message: error.message,
        code: error.code,
        details: error.details,
        hint: error.hint
      } : null
    });
  } catch (err: any) {
    results.tests.push({
      name: 'SMS Log Insert (null assessment_id)',
      success: false,
      exception: err.message,
      stack: err.stack
    });
  }

  // Test 2: Try inserting with a fake but valid-looking UUID assessment_id
  try {
    const fakeAssessmentId = '00000000-0000-0000-0000-000000000000';

    const smsLogPayload = {
      assessment_id: fakeAssessmentId,
      type: 'test_sms_diagnostic',
      template_key: 'test_sms_diagnostic',
      status: 'sent',
      channel: 'sms',
      provider: 'twilio',
      provider_message_id: `SM${testId}-2`,
      recipient: 'test-hash-456...',
      message: 'Test SMS with fake assessment_id',
      sent_at: new Date().toISOString(),
      created_at: new Date().toISOString()
    };

    const { data, error } = await supabase
      .from('communication_logs')
      .insert(smsLogPayload)
      .select();

    results.tests.push({
      name: 'SMS Log Insert (fake UUID assessment_id)',
      payload: smsLogPayload,
      success: !error,
      data: data,
      error: error ? {
        message: error.message,
        code: error.code,
        details: error.details,
        hint: error.hint
      } : null
    });
  } catch (err: any) {
    results.tests.push({
      name: 'SMS Log Insert (fake UUID assessment_id)',
      success: false,
      exception: err.message,
      stack: err.stack
    });
  }

  // Test 3: Try inserting an email log for comparison
  try {
    const emailLogPayload = {
      assessment_id: null,
      type: 'test_email_diagnostic',
      template_key: 'test_email_diagnostic',
      status: 'sent',
      channel: 'email',
      provider: 'sendgrid',
      provider_message_id: `SG${testId}`,
      recipient: 'test-hash-789...',
      subject: 'Test Email Subject',
      message: 'Test email message for diagnostic purposes',
      sent_at: new Date().toISOString(),
      created_at: new Date().toISOString()
    };

    const { data, error } = await supabase
      .from('communication_logs')
      .insert(emailLogPayload)
      .select();

    results.tests.push({
      name: 'Email Log Insert (comparison)',
      payload: emailLogPayload,
      success: !error,
      data: data,
      error: error ? {
        message: error.message,
        code: error.code,
        details: error.details,
        hint: error.hint
      } : null
    });
  } catch (err: any) {
    results.tests.push({
      name: 'Email Log Insert (comparison)',
      success: false,
      exception: err.message,
      stack: err.stack
    });
  }

  // Test 4: Check RLS status
  try {
    const { data, error } = await supabase
      .rpc('check_rls_status', {})
      .single();

    results.tests.push({
      name: 'RLS Status Check (via RPC)',
      success: !error,
      data: data,
      error: error ? { message: error.message, code: error.code } : null
    });
  } catch (err: any) {
    results.tests.push({
      name: 'RLS Status Check',
      success: false,
      note: 'RPC function does not exist - this is expected',
      exception: err.message
    });
  }

  // Summary
  const smsTests = results.tests.filter((t: any) => t.name.includes('SMS'));
  const emailTests = results.tests.filter((t: any) => t.name.includes('Email'));

  results.summary = {
    sms_inserts_passed: smsTests.filter((t: any) => t.success).length,
    sms_inserts_failed: smsTests.filter((t: any) => !t.success).length,
    email_inserts_passed: emailTests.filter((t: any) => t.success).length,
    email_inserts_failed: emailTests.filter((t: any) => !t.success).length,
    diagnosis: smsTests.some((t: any) => !t.success) && emailTests.every((t: any) => t.success)
      ? 'SMS inserts failing but email works - likely channel-specific constraint'
      : smsTests.every((t: any) => t.success)
        ? 'SMS inserts working - issue may be in the calling code'
        : 'Both SMS and email failing - likely RLS or permission issue'
  };

  // Cleanup: Remove test records
  try {
    await supabase
      .from('communication_logs')
      .delete()
      .like('template_key', 'test_%');
    results.cleanup = 'Test records deleted';
  } catch (err: any) {
    results.cleanup = `Cleanup failed: ${err.message}`;
  }

  return NextResponse.json(results, { status: 200 });
}
