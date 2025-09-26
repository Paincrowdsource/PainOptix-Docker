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
 * Render error HTML page with professional branding
 */
function renderErrorHtml(message: string): string {
  const appUrl = process.env.NEXT_PUBLIC_APP_URL || 'https://painoptix.com';
  const normalizedAppUrl = appUrl.replace(/\/$/, '');
  const logoUrl = `${normalizedAppUrl}/branding/painoptix_logo_bg_removed.png`;

  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>PainOptix - Link Expired</title>
  <style>
    body {
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;
      line-height: 1.6;
      color: #445B78;
      min-height: 100vh;
      display: flex;
      align-items: flex-start;
      justify-content: center;
      padding: 48px 16px 64px;
      background: linear-gradient(180deg, #f6f9ff 0%, #eef2f9 100%);
      margin: 0;
    }
    .container {
      background: #ffffff;
      border-radius: 16px;
      box-shadow: 0 24px 48px rgba(11, 83, 148, 0.12);
      padding: 48px;
      max-width: 640px;
      width: 100%;
      text-align: center;
    }
    .logo {
      display: flex;
      justify-content: center;
      align-items: center;
      margin: 0 auto 32px;
      height: 120px;
    }
    .logo img {
      height: auto;
      max-height: 120px;
      width: auto;
    }
    .error-icon {
      width: 64px;
      height: 64px;
      margin: 0 auto 24px;
      background: rgba(220, 53, 69, 0.1);
      border-radius: 50%;
      display: flex;
      align-items: center;
      justify-content: center;
      font-size: 32px;
    }
    h1 {
      font-size: 28px;
      font-weight: 700;
      color: #0B5394;
      margin: 0 0 16px;
    }
    .message {
      font-size: 18px;
      color: #445B78;
      margin: 0 0 12px;
    }
    .subtitle {
      font-size: 16px;
      color: #5E6B7E;
      margin: 0 0 32px;
      max-width: 480px;
      margin-left: auto;
      margin-right: auto;
    }
    .buttons {
      display: flex;
      justify-content: center;
      gap: 12px;
      flex-wrap: wrap;
      margin: 32px 0 0;
    }
    .btn {
      display: inline-flex;
      align-items: center;
      justify-content: center;
      padding: 14px 28px;
      border-radius: 999px;
      font-weight: 600;
      text-decoration: none;
      transition: all 0.2s ease;
      border: 1px solid transparent;
      font-size: 16px;
    }
    .btn.primary {
      background-color: #0B5394;
      color: #ffffff;
      border-color: #0B5394;
    }
    .btn.primary:hover {
      background-color: #093b72;
      border-color: #093b72;
      box-shadow: 0 4px 12px rgba(11, 83, 148, 0.2);
    }
    .btn.secondary {
      background-color: transparent;
      color: #0B5394;
      border-color: #0B5394;
    }
    .btn.secondary:hover {
      background-color: rgba(11, 83, 148, 0.08);
    }
    .help-text {
      margin-top: 40px;
      padding-top: 32px;
      border-top: 1px solid rgba(11, 83, 148, 0.08);
      font-size: 14px;
      color: #5E6B7E;
    }
    .help-text a {
      color: #0B5394;
      text-decoration: none;
    }
    .help-text a:hover {
      text-decoration: underline;
    }
    @media (max-width: 600px) {
      .container {
        padding: 32px 24px;
      }
      .logo {
        height: 100px;
      }
      .logo img {
        max-height: 100px;
      }
      h1 {
        font-size: 24px;
      }
      .message {
        font-size: 16px;
      }
      .buttons {
        gap: 10px;
      }
    }
  </style>
</head>
<body>
  <div class="container">
    <div class="logo">
      <img src="${logoUrl}" alt="PainOptix" />
    </div>
    <div class="error-icon">⚠️</div>
    <h1>Link Expired or Invalid</h1>
    <p class="message">${message}</p>
    <p class="subtitle">
      This check-in link may have expired or been used already.
      If you need assistance, please contact your healthcare provider or try the assessment again.
    </p>
    <div class="buttons">
      <a href="/" class="btn primary">Return to Homepage</a>
      <a href="/test-assessment" class="btn secondary">Start New Assessment</a>
    </div>
    <div class="help-text">
      Need help? <a href="mailto:support@painoptix.com">Contact Support</a>
    </div>
  </div>
</body>
</html>`;
}
