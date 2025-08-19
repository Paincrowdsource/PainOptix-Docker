import { getServiceSupabase } from '@/lib/supabase';
import { sendEmail } from '@/lib/comm/email';
import { logEvent } from '@/lib/logging';

/**
 * Day 4 follow-up for Enhanced ($5) purchasers
 * Check-in with subtle mention of Monograph option
 */
export async function sendEnhancedFollowUp(assessmentId: string) {
  const supabase = getServiceSupabase();
  
  // Get assessment data
  const { data: assessment } = await supabase
    .from('assessments')
    .select('*')
    .eq('id', assessmentId)
    .single();
  
  if (!assessment) {
    await logEvent('followup_skip_no_assessment', { assessmentId });
    return;
  }
  
  // Check for red flags or marketing opt-out
  if (assessment.has_red_flags || assessment.marketing_opted_out) {
    await logEvent('followup_suppressed', { 
      assessmentId,
      reason: assessment.has_red_flags ? 'red_flags' : 'opted_out'
    });
    return;
  }
  
  // Idempotency check with deterministic key
  const dedupeKey = `enhanced_d4:${assessmentId}`;
  try {
    await supabase.rpc('claim_email_send', { dedupe_key: dedupeKey });
  } catch (err: any) {
    if (err.message?.includes('duplicate')) {
      await logEvent('followup_duplicate_prevented', { assessmentId, type: 'enhanced_d4' });
      return;
    }
    throw err;
  }
  
  const html = `
<!DOCTYPE html>
<html>
<head>
  <style>
    body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; line-height: 1.6; color: #333; }
    .container { max-width: 600px; margin: 0 auto; padding: 20px; }
    .header { background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 30px; border-radius: 10px 10px 0 0; text-align: center; }
    .content { background: white; padding: 30px; border: 1px solid #e2e8f0; border-radius: 0 0 10px 10px; }
    .button { display: inline-block; padding: 12px 24px; background: #667eea; color: white; text-decoration: none; border-radius: 5px; margin: 20px 0; }
    .footer { text-align: center; color: #718096; font-size: 14px; margin-top: 30px; padding-top: 20px; border-top: 1px solid #e2e8f0; }
    .tip-box { background: #f7fafc; padding: 20px; border-radius: 8px; margin: 20px 0; border-left: 4px solid #667eea; }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <h1>How's Your Progress?</h1>
    </div>
    <div class="content">
      <p>Hi there,</p>
      
      <p>It's been a few days since you received your Enhanced Report. We wanted to check in and see how you're doing with the information.</p>
      
      <div class="tip-box">
        <h3>Quick Implementation Tip</h3>
        <p>Many users find it helpful to start with just one recommendation from the report and implement it consistently for a week before adding others. This approach tends to lead to more sustainable improvements.</p>
      </div>
      
      <h3>Questions About Your Report?</h3>
      <p>Your Enhanced Report contains comprehensive information, but we understand you might have questions about specific sections or recommendations. Feel free to share relevant sections with your healthcare provider during your next consultation.</p>
      
      <h3>Going Deeper</h3>
      <p>Some users find additional value in our Complete Monograph, which includes:</p>
      <ul>
        <li>Medical illustrations to better visualize anatomical relationships</li>
        <li>Case studies showing real-world treatment outcomes</li>
        <li>Recovery timeline modeling based on clinical data</li>
        <li>Provider communication templates for more effective consultations</li>
      </ul>
      
      <p>The Monograph is designed for those who want the most comprehensive educational resource available for their condition.</p>
      
      <a href="${process.env.NEXT_PUBLIC_APP_URL}/upgrade?assessment=${assessment.id}&to=monograph" class="button">
        Learn More About the Monograph
      </a>
      
      <p>Whether you stick with your Enhanced Report or explore additional resources, we're here to support your educational journey.</p>
      
      <p>Best wishes for your continued progress,<br>
      The PainOptix Team</p>
      
      <div class="footer">
        <p><strong>Medical Disclaimer:</strong> This educational material does not replace professional medical advice.</p>
        <p>© ${new Date().getFullYear()} PainOptix. All rights reserved.</p>
        <p>To stop receiving follow-up emails, <a href="${process.env.NEXT_PUBLIC_APP_URL}/unsubscribe?id=${assessment.id}">click here</a>.</p>
      </div>
    </div>
  </div>
</body>
</html>
  `.trim();
  
  await sendEmail(
    assessment.email,
    'Quick Check-In: How Are You Doing?',
    html
  );
  
  await logEvent('followup_sent_enhanced_d4', { assessmentId });
}

/**
 * Day 7 follow-up for Monograph ($20) purchasers
 * Implementation support with optional coaching mention
 */
export async function sendMonographFollowUp(assessmentId: string) {
  const supabase = getServiceSupabase();
  
  // Get assessment data
  const { data: assessment } = await supabase
    .from('assessments')
    .select('*')
    .eq('id', assessmentId)
    .single();
  
  if (!assessment) {
    await logEvent('followup_skip_no_assessment', { assessmentId });
    return;
  }
  
  // Check for red flags or marketing opt-out
  if (assessment.has_red_flags || assessment.marketing_opted_out) {
    await logEvent('followup_suppressed', { 
      assessmentId,
      reason: assessment.has_red_flags ? 'red_flags' : 'opted_out'
    });
    return;
  }
  
  // Idempotency check with deterministic key
  const dedupeKey = `mono_d7:${assessmentId}`;
  try {
    await supabase.rpc('claim_email_send', { dedupe_key: dedupeKey });
  } catch (err: any) {
    if (err.message?.includes('duplicate')) {
      await logEvent('followup_duplicate_prevented', { assessmentId, type: 'mono_d7' });
      return;
    }
    throw err;
  }
  
  const html = `
<!DOCTYPE html>
<html>
<head>
  <style>
    body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; line-height: 1.6; color: #333; }
    .container { max-width: 600px; margin: 0 auto; padding: 20px; }
    .header { background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 30px; border-radius: 10px 10px 0 0; text-align: center; }
    .content { background: white; padding: 30px; border: 1px solid #e2e8f0; border-radius: 0 0 10px 10px; }
    .button { display: inline-block; padding: 12px 24px; background: #667eea; color: white; text-decoration: none; border-radius: 5px; margin: 20px 0; }
    .footer { text-align: center; color: #718096; font-size: 14px; margin-top: 30px; padding-top: 20px; border-top: 1px solid #e2e8f0; }
    .success-tip { background: #f0fff4; border-left: 4px solid #48bb78; padding: 15px; margin: 20px 0; }
    .resource-box { background: #f7fafc; padding: 20px; border-radius: 8px; margin: 20px 0; }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <h1>Making the Most of Your Monograph</h1>
    </div>
    <div class="content">
      <p>Hi there,</p>
      
      <p>It's been a week since you received your Complete Pain Management Monograph. We hope you've had a chance to review the comprehensive materials and start implementing some of the recommendations.</p>
      
      <div class="success-tip">
        <h3>Implementation Success Tip</h3>
        <p>Research shows that people who track their progress are 2x more likely to achieve their health goals. Consider using the Recovery Timeline section of your monograph to benchmark your progress over the coming weeks.</p>
      </div>
      
      <h3>Common Questions at This Stage</h3>
      <p>Many monograph users find these sections particularly helpful after the first week:</p>
      <ul>
        <li><strong>Provider Discussion Guide (Section 4):</strong> Prepare for your next appointment</li>
        <li><strong>Lifestyle Integration (Section 7):</strong> Practical daily modifications</li>
        <li><strong>Case Studies (Section 5):</strong> See how others navigated similar challenges</li>
      </ul>
      
      <div class="resource-box">
        <h3>Additional Support Available</h3>
        <p>As a monograph owner, you've invested in comprehensive education about your condition. Some users find value in personalized coaching support to help implement the recommendations effectively.</p>
        
        <p>Our optional coaching program includes:</p>
        <ul>
          <li>Weekly check-ins to track progress</li>
          <li>Personalized implementation strategies</li>
          <li>Direct answers to your specific questions</li>
          <li>Accountability and motivation support</li>
        </ul>
        
        <p>This is completely optional and only for those who want additional personalized guidance.</p>
      </div>
      
      <h3>Your Progress Matters</h3>
      <p>Remember, improvement often comes in waves rather than a straight line. The comprehensive information in your monograph is designed to support you through the entire journey, not just the first few days.</p>
      
      <p>Keep referring back to different sections as your needs evolve. The monograph is your permanent resource.</p>
      
      <p>Wishing you continued progress,<br>
      The PainOptix Team</p>
      
      <div class="footer">
        <p><strong>Medical Disclaimer:</strong> Educational materials and coaching support do not replace professional medical care.</p>
        <p>© ${new Date().getFullYear()} PainOptix. All rights reserved.</p>
        <p>To manage your preferences, <a href="${process.env.NEXT_PUBLIC_APP_URL}/preferences?id=${assessment.id}">click here</a>.</p>
      </div>
    </div>
  </div>
</body>
</html>
  `.trim();
  
  await sendEmail(
    assessment.email,
    'Week 1 Check-In: Your Monograph Journey',
    html
  );
  
  await logEvent('followup_sent_mono_d7', { assessmentId });
}

/**
 * Day 3 follow-up for free tier users
 * Educational tip, only if prior engagement detected
 */
export async function sendFreeFollowUp(assessmentId: string) {
  const supabase = getServiceSupabase();
  
  // Get assessment data
  const { data: assessment } = await supabase
    .from('assessments')
    .select('*')
    .eq('id', assessmentId)
    .single();
  
  if (!assessment) {
    await logEvent('followup_skip_no_assessment', { assessmentId });
    return;
  }
  
  // Check for red flags or marketing opt-out
  if (assessment.has_red_flags || assessment.marketing_opted_out) {
    await logEvent('followup_suppressed', { 
      assessmentId,
      reason: assessment.has_red_flags ? 'red_flags' : 'opted_out'
    });
    return;
  }
  
  // Check for engagement (guide opened)
  if (!assessment.guide_opened_at) {
    await logEvent('followup_skip_no_engagement', { assessmentId });
    return;
  }
  
  // Idempotency check with deterministic key
  const dedupeKey = `free_d3:${assessmentId}`;
  try {
    await supabase.rpc('claim_email_send', { dedupe_key: dedupeKey });
  } catch (err: any) {
    if (err.message?.includes('duplicate')) {
      await logEvent('followup_duplicate_prevented', { assessmentId, type: 'free_d3' });
      return;
    }
    throw err;
  }
  
  const html = `
<!DOCTYPE html>
<html>
<head>
  <style>
    body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; line-height: 1.6; color: #333; }
    .container { max-width: 600px; margin: 0 auto; padding: 20px; }
    .header { background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 30px; border-radius: 10px 10px 0 0; text-align: center; }
    .content { background: white; padding: 30px; border: 1px solid #e2e8f0; border-radius: 0 0 10px 10px; }
    .button { display: inline-block; padding: 12px 24px; background: #667eea; color: white; text-decoration: none; border-radius: 5px; margin: 20px 0; }
    .footer { text-align: center; color: #718096; font-size: 14px; margin-top: 30px; padding-top: 20px; border-top: 1px solid #e2e8f0; }
    .tip-card { background: linear-gradient(135deg, #f6f8fb 0%, #f0f4f8 100%); padding: 25px; border-radius: 10px; margin: 20px 0; }
    .did-you-know { background: #fef5e7; border-left: 4px solid #f39c12; padding: 15px; margin: 20px 0; }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <h1>Your Educational Tip of the Week</h1>
    </div>
    <div class="content">
      <p>Hi there,</p>
      
      <p>Thank you for reviewing your free educational guide. We hope you found the information helpful in understanding your condition better.</p>
      
      <div class="tip-card">
        <h2>📚 This Week's Educational Insight</h2>
        <p><strong>The 10-Minute Rule for Back Pain:</strong></p>
        <p>Research shows that changing positions every 30-60 minutes can significantly reduce pain intensity. If you're sitting, stand and walk for 2-3 minutes. If you're standing, sit and stretch. This simple practice can prevent muscle fatigue and reduce pain buildup throughout the day.</p>
        
        <p>Try setting a gentle reminder on your phone to prompt position changes. Many users report this single change makes a noticeable difference within the first week.</p>
      </div>
      
      <div class="did-you-know">
        <strong>Did You Know?</strong><br>
        Movement is often more effective than rest for most types of back pain. Gentle, regular movement helps maintain flexibility and prevents muscles from becoming stiff and painful.
      </div>
      
      <h3>Want More Insights Like This?</h3>
      <p>Your free guide covered the essentials, but there's so much more to learn about managing your condition effectively. Our paid reports include:</p>
      
      <p><strong>Enhanced Report ($5):</strong></p>
      <ul>
        <li>Detailed explanations of why certain treatments work</li>
        <li>Scientific research summaries in plain language</li>
        <li>Comprehensive treatment comparisons</li>
      </ul>
      
      <p><strong>Complete Monograph ($20):</strong></p>
      <ul>
        <li>Everything in the Enhanced Report, plus...</li>
        <li>Visual guides and medical illustrations</li>
        <li>Recovery roadmaps and timelines</li>
        <li>Professional resources for working with your healthcare team</li>
      </ul>
      
      <a href="${process.env.NEXT_PUBLIC_APP_URL}/upgrade?assessment=${assessment.id}" class="button">
        Explore Your Options
      </a>
      
      <p>Whether you choose to upgrade or stick with your free guide, we're glad you're taking steps to understand your condition better.</p>
      
      <p>Stay well,<br>
      The PainOptix Team</p>
      
      <div class="footer">
        <p><strong>Medical Disclaimer:</strong> Educational tips are not personalized medical advice. Always consult healthcare providers for treatment decisions.</p>
        <p>© ${new Date().getFullYear()} PainOptix. All rights reserved.</p>
        <p>Don't want these educational emails? <a href="${process.env.NEXT_PUBLIC_APP_URL}/unsubscribe?id=${assessment.id}">Unsubscribe here</a>.</p>
      </div>
    </div>
  </div>
</body>
</html>
  `.trim();
  
  await sendEmail(
    assessment.email,
    'Your Weekly Back Pain Education Tip',
    html
  );
  
  await logEvent('followup_sent_free_d3', { assessmentId });
}

/**
 * Day 14 follow-up for free tier users (V1.2 requirement)
 * Educational content, no urgency, soft mention of upgrades
 * Only sent if user has engaged with previous emails
 */
export async function sendFreeD14FollowUp(assessmentId: string) {
  const supabase = getServiceSupabase();
  
  // Get assessment data
  const { data: assessment } = await supabase
    .from('assessments')
    .select('*')
    .eq('id', assessmentId)
    .single();
  
  if (!assessment) {
    await logEvent('followup_skip_no_assessment', { assessmentId, type: 'free_d14' });
    return;
  }
  
  // Check for red flags or marketing opt-out
  if (assessment.has_red_flags || assessment.marketing_opted_out) {
    await logEvent('followup_suppressed', { 
      assessmentId,
      type: 'free_d14',
      reason: assessment.has_red_flags ? 'red_flags' : 'opted_out'
    });
    return;
  }
  
  // Check for engagement - required for 14-day follow-up
  const { data: hasEngaged } = await supabase.rpc('has_email_engagement', {
    p_assessment_id: assessmentId
  });
  
  if (!hasEngaged) {
    await logEvent('followup_skip_no_engagement', { assessmentId, type: 'free_d14' });
    return;
  }
  
  // Idempotency check with deterministic key
  const dedupeKey = `free_d14:${assessmentId}`;
  try {
    await supabase.rpc('claim_email_send', { dedupe_key: dedupeKey });
  } catch (err: any) {
    if (err.message?.includes('duplicate')) {
      await logEvent('followup_duplicate_prevented', { assessmentId, type: 'free_d14' });
      return;
    }
    throw err;
  }
  
  const html = `
<!DOCTYPE html>
<html>
<head>
  <style>
    body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; line-height: 1.6; color: #333; }
    .container { max-width: 600px; margin: 0 auto; padding: 20px; }
    .header { background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 30px; border-radius: 10px 10px 0 0; text-align: center; }
    .content { background: white; padding: 30px; border: 1px solid #e2e8f0; border-radius: 0 0 10px 10px; }
    .button { display: inline-block; padding: 12px 24px; background: #667eea; color: white; text-decoration: none; border-radius: 5px; margin: 20px 0; }
    .footer { text-align: center; color: #718096; font-size: 14px; margin-top: 30px; padding-top: 20px; border-top: 1px solid #e2e8f0; }
    .progress-box { background: #f0fff4; border-left: 4px solid #48bb78; padding: 20px; margin: 20px 0; border-radius: 5px; }
    .resource-card { background: #f7fafc; padding: 20px; border-radius: 8px; margin: 20px 0; }
    .checklist { background: white; border: 2px solid #e2e8f0; padding: 20px; border-radius: 8px; margin: 20px 0; }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <h1>Your Two-Week Progress Check</h1>
    </div>
    <div class="content">
      <p>Hi there,</p>
      
      <p>It's been two weeks since you started your educational journey with PainOptix. We hope you've found the information helpful in understanding your situation better.</p>
      
      <div class="progress-box">
        <h3>📊 Two-Week Milestone</h3>
        <p>Research shows that people who actively engage with educational health materials for two weeks are more likely to:</p>
        <ul>
          <li>Better understand their condition</li>
          <li>Have more productive healthcare conversations</li>
          <li>Make informed decisions about their care</li>
        </ul>
      </div>
      
      <h3>Continuing Your Educational Journey</h3>
      <p>Here are some ways to build on what you've learned:</p>
      
      <div class="checklist">
        <h4>✓ Progress Checklist</h4>
        <ul style="list-style: none; padding-left: 0;">
          <li>☐ Review your initial educational guide</li>
          <li>☐ Note any changes in your situation</li>
          <li>☐ Prepare questions for your next healthcare visit</li>
          <li>☐ Consider which educational strategies have been most helpful</li>
          <li>☐ Think about areas where you'd like more information</li>
        </ul>
      </div>
      
      <div class="resource-card">
        <h3>Additional Educational Resources</h3>
        <p>Based on your engagement with our materials, you might find value in our expanded educational resources:</p>
        
        <p><strong>Enhanced Educational Guide ($5):</strong> Provides deeper insights into the science behind various management approaches, with extensive references to current research.</p>
        
        <p>This is completely optional - many users find the free guide sufficient for their needs. We mention it only for those seeking more comprehensive educational material.</p>
        
        <a href="${process.env.NEXT_PUBLIC_APP_URL}/resources?assessment=${assessment.id}" class="button">
          Explore Educational Resources
        </a>
      </div>
      
      <h3>Remember: You're Not Alone</h3>
      <p>Understanding your health situation is a journey, not a destination. Whether you continue with our free resources or explore additional materials, we're here to support your educational needs.</p>
      
      <p>Thank you for trusting PainOptix as part of your health education journey.</p>
      
      <p>Best wishes for your continued learning,<br>
      The PainOptix Education Team</p>
      
      <div class="footer">
        <p><strong>Educational Disclaimer:</strong> This material is for educational purposes only and does not constitute medical advice. Always consult qualified healthcare providers for medical decisions.</p>
        <p>© ${new Date().getFullYear()} PainOptix. All rights reserved.</p>
        <p>This is the final scheduled email in your free educational series. To explore more resources or manage preferences, <a href="${process.env.NEXT_PUBLIC_APP_URL}/preferences?id=${assessment.id}">visit your account</a>.</p>
      </div>
    </div>
  </div>
</body>
</html>
  `.trim();
  
  await sendEmail(
    assessment.email,
    'Your Two-Week Educational Progress Check',
    html
  );
  
  await logEvent('followup_sent_free_d14', { assessmentId });
}