import { NextRequest, NextResponse } from 'next/server';
import { verify } from '@/lib/checkins/token';
import { getServiceSupabase } from '@/lib/supabase';
import { renderConfirmationHtml } from '@/lib/checkins/landingPage';

export const dynamic = 'force-dynamic';

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
