import { NextRequest, NextResponse } from 'next/server';
import { verify, sign } from '@/lib/checkins/token';
import { getServiceSupabase } from '@/lib/supabase';
import { sourceTag } from '@/lib/checkins/attribution';

export async function GET(request: NextRequest) {
  try {
    // Get token from query params
    const url = new URL(request.url);
    const token = url.searchParams.get('token');

    if (!token) {
      return new NextResponse(renderErrorHtml('Missing token'), {
        status: 400,
        headers: { 'Content-Type': 'text/html' }
      });
    }

    // Verify token
    const payload = verify(token);

    if (!payload) {
      return new NextResponse(renderErrorHtml('Invalid or expired link'), {
        status: 400,
        headers: { 'Content-Type': 'text/html' }
      });
    }

    const { assessment_id, day, value } = payload;

    // Record the response
    const supabase = getServiceSupabase();
    const { error: upsertError } = await supabase
      .from('check_in_responses')
      .upsert({
        assessment_id,
        day,
        value,
        created_at: new Date().toISOString()
      }, {
        onConflict: 'assessment_id,day'
      });

    if (upsertError) {
      console.error('Failed to record check-in response:', upsertError);
      return new NextResponse(renderErrorHtml('Failed to record response'), {
        status: 500,
        headers: { 'Content-Type': 'text/html' }
      });
    }

    // Render confirmation page based on value
    const html = renderConfirmationHtml(value, day, assessment_id);

    return new NextResponse(html, {
      status: 200,
      headers: { 'Content-Type': 'text/html' }
    });
  } catch (error: any) {
    console.error('Check-in response error:', error);
    return new NextResponse(renderErrorHtml('An error occurred'), {
      status: 500,
      headers: { 'Content-Type': 'text/html' }
    });
  }
}

/**
 * Render error HTML page
 */
function renderErrorHtml(message: string): string {
  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>PainOptix - Error</title>
  <style>
    body {
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;
      line-height: 1.6;
      color: #333;
      max-width: 600px;
      margin: 0 auto;
      padding: 40px 20px;
      background: #f5f5f5;
    }
    .container {
      background: white;
      border-radius: 8px;
      padding: 40px;
      box-shadow: 0 2px 4px rgba(0,0,0,0.1);
      text-align: center;
    }
    h1 {
      color: #dc3545;
      margin-bottom: 20px;
    }
    p {
      margin-bottom: 20px;
      color: #666;
    }
    .home-link {
      display: inline-block;
      padding: 12px 24px;
      background-color: #4CAF50;
      color: white;
      text-decoration: none;
      border-radius: 4px;
      margin-top: 20px;
    }
  </style>
</head>
<body>
  <div class="container">
    <h1>Oops!</h1>
    <p>${message}</p>
    <p>The link you clicked may have expired or is invalid.</p>
    <a href="/" class="home-link">Return to Homepage</a>
  </div>
</body>
</html>`;
}

/**
 * Render confirmation HTML page based on response
 */
function renderConfirmationHtml(value: 'better' | 'same' | 'worse', day: number, assessmentId: string): string {
  const appUrl = process.env.NEXT_PUBLIC_APP_URL || 'https://painoptix.com';

  // Generate new token for note form
  const noteToken = sign({
    assessment_id: assessmentId,
    day: day as 3 | 7 | 14,
    value: value as 'better' | 'same' | 'worse'
  });

  // Add source attribution to CTAs
  const source = sourceTag(day as 3 | 7 | 14);

  // Determine content based on value
  let title = '';
  let message = '';
  let ctaButtons = '';

  if (value === 'better') {
    title = 'Great to hear!';
    message = `We're glad you're feeling better on day ${day}. Keep up the gentle movement and pacing that's working for you.`;
    ctaButtons = `
      <a href="${appUrl}/guide?source=${source}" class="btn">Browse Educational Resources</a>
    `;
  } else if (value === 'same') {
    title = 'Thanks for checking in';
    message = `Plateaus are normal on day ${day}. Consider trying a structured educational plan to help guide your recovery.`;
    ctaButtons = `
      <a href="${appUrl}/guide?source=${source}" class="btn">View Educational Guide</a>
      <a href="${appUrl}/assessment?source=${source}" class="btn secondary">Retake Assessment</a>
    `;
  } else {
    title = 'We hear you';
    message = `It's tough when things aren't improving by day ${day}. Consider deeper educational support or professional consultation.`;
    ctaButtons = `
      <a href="${appUrl}/guide?source=${source}" class="btn primary">Get Complete Monograph</a>
      <a href="${appUrl}/comprehensive-care?source=${source}" class="btn secondary">Find Professional Care</a>
    `;
  }

  const disclaimer = 'Educational use only. Not a diagnosis or treatment. If symptoms worsen or new symptoms develop, seek medical care.';

  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>PainOptix - Check-In Recorded</title>
  <style>
    body {
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;
      line-height: 1.6;
      color: #333;
      max-width: 600px;
      margin: 0 auto;
      padding: 40px 20px;
      background: #f5f5f5;
    }
    .container {
      background: white;
      border-radius: 8px;
      padding: 40px;
      box-shadow: 0 2px 4px rgba(0,0,0,0.1);
    }
    h1 {
      color: #2c3e50;
      margin-bottom: 20px;
      text-align: center;
    }
    .message {
      font-size: 18px;
      margin-bottom: 30px;
      text-align: center;
      color: #555;
    }
    .buttons {
      text-align: center;
      margin: 30px 0;
    }
    .btn {
      display: inline-block;
      padding: 12px 24px;
      background-color: #4CAF50;
      color: white;
      text-decoration: none;
      border-radius: 4px;
      margin: 10px 5px;
      font-weight: 500;
    }
    .btn.secondary {
      background-color: #757575;
    }
    .btn.primary {
      background-color: #2196F3;
    }
    .note-section {
      background-color: #f9f9f9;
      padding: 20px;
      border-radius: 4px;
      margin: 30px 0;
    }
    .note-form textarea {
      width: 100%;
      padding: 10px;
      border: 1px solid #ddd;
      border-radius: 4px;
      font-size: 14px;
      resize: vertical;
      min-height: 80px;
      font-family: inherit;
    }
    .note-form button {
      background-color: #6c757d;
      color: white;
      padding: 10px 20px;
      border: none;
      border-radius: 4px;
      cursor: pointer;
      font-size: 14px;
      margin-top: 10px;
    }
    .note-form button:hover {
      background-color: #5a6268;
    }
    .disclaimer {
      background-color: #f5f5f5;
      padding: 15px;
      border-radius: 4px;
      margin-top: 30px;
      font-size: 13px;
      color: #666;
      text-align: center;
    }
    .success-icon {
      text-align: center;
      font-size: 48px;
      margin-bottom: 20px;
    }
  </style>
</head>
<body>
  <div class="container">
    <div class="success-icon">✓</div>
    <h1>${title}</h1>
    <p class="message">${message}</p>

    <div class="buttons">
      ${ctaButtons}
    </div>

    <div class="note-section">
      <h3 style="margin-top: 0; margin-bottom: 10px; color: #2c3e50;">Additional Notes (Optional)</h3>
      <p style="font-size: 14px; color: #666; margin-bottom: 15px;">
        If you'd like to share any additional information about your condition, please let us know below.
      </p>
      <form class="note-form" method="post" action="/api/checkins/note">
        <input type="hidden" name="token" value="${noteToken}">
        <textarea
          name="note"
          maxlength="280"
          placeholder="Share any changes, concerns, or observations..."
        ></textarea>
        <button type="submit">Submit Note</button>
      </form>
    </div>

    <div class="disclaimer">
      ${disclaimer}
    </div>
  </div>
</body>
</html>`;
}