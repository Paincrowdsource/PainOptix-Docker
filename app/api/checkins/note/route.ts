import { NextRequest, NextResponse } from 'next/server';
import { verify } from '@/lib/checkins/token';
import { getServiceSupabase } from '@/lib/supabase';

// Red flag keywords - hardcoded for simplicity in serverless
const RED_FLAG_TERMS = [
  'bladder',
  'bowel',
  'saddle anesthesia',
  'progressive weakness',
  'fever',
  'chills',
  'unexplained weight loss',
  'night pain',
  'numbness spreading',
  "can't walk",
  "can't stand",
  'loss of control',
  'incontinent',
  'paralysis',
  'severe pain',
  'emergency',
  'hospital',
  'cancer history',
  'trauma',
  'fall',
  'accident'
];

export async function POST(request: NextRequest) {
  try {
    // Parse form data
    const formData = await request.formData();
    const token = formData.get('token') as string;
    const note = formData.get('note') as string;

    if (!token) {
      return new NextResponse(renderErrorHtml('Missing token'), {
        status: 400,
        headers: { 'Content-Type': 'text/html' }
      });
    }

    if (!note || note.trim().length === 0) {
      return new NextResponse(renderSuccessHtml(false), {
        status: 200,
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

    const { assessment_id, day } = payload;
    const supabase = getServiceSupabase();

    // Update the note (only if not already present)
    const { data: existing } = await supabase
      .from('check_in_responses')
      .select('note')
      .eq('assessment_id', assessment_id)
      .eq('day', day)
      .single();

    if (!existing?.note) {
      const { error: updateError } = await supabase
        .from('check_in_responses')
        .update({ note: note.substring(0, 280) })
        .eq('assessment_id', assessment_id)
        .eq('day', day);

      if (updateError) {
        console.error('Failed to update note:', updateError);
      }
    }

    // Check for red flags
    const noteLower = note.toLowerCase();
    const matchedTerms: string[] = [];

    for (const term of RED_FLAG_TERMS) {
      if (noteLower.includes(term.toLowerCase())) {
        matchedTerms.push(term);
      }
    }

    let hasRedFlag = false;

    if (matchedTerms.length > 0) {
      hasRedFlag = true;

      // Insert alert
      const { error: alertError } = await supabase
        .from('alerts')
        .insert({
          assessment_id,
          type: 'red_flag',
          payload: {
            day,
            matched: matchedTerms,
            note_excerpt: note.substring(0, 100)
          }
        });

      if (alertError) {
        console.error('Failed to create alert:', alertError);
      }
    }

    // Return appropriate response
    return new NextResponse(renderSuccessHtml(hasRedFlag), {
      status: 200,
      headers: { 'Content-Type': 'text/html' }
    });
  } catch (error: any) {
    console.error('Note endpoint error:', error);
    return new NextResponse(renderErrorHtml('An error occurred'), {
      status: 500,
      headers: { 'Content-Type': 'text/html' }
    });
  }
}

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
  </style>
</head>
<body>
  <div class="container">
    <h1>Oops!</h1>
    <p>${message}</p>
    <p>Please try again or contact support if the issue persists.</p>
  </div>
</body>
</html>`;
}

function renderSuccessHtml(hasRedFlag: boolean): string {
  const title = hasRedFlag ? 'Important Notice' : 'Thank You';
  const message = hasRedFlag
    ? `Based on your note, we recommend consulting with a healthcare provider promptly.
       Some symptoms require immediate medical attention to ensure your safety and wellbeing.`
    : 'Your note has been recorded. Thank you for the additional information.';

  const bgColor = hasRedFlag ? '#fff3cd' : '#d4edda';
  const borderColor = hasRedFlag ? '#ffc107' : '#28a745';
  const textColor = hasRedFlag ? '#856404' : '#155724';

  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>PainOptix - ${title}</title>
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
    .alert {
      background-color: ${bgColor};
      border: 1px solid ${borderColor};
      border-radius: 4px;
      padding: 20px;
      margin-bottom: 20px;
      color: ${textColor};
    }
    h1 {
      color: #2c3e50;
      margin-bottom: 20px;
      text-align: center;
    }
    .message {
      font-size: 16px;
      margin-bottom: 20px;
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
    .cta {
      text-align: center;
      margin-top: 30px;
    }
    .btn {
      display: inline-block;
      padding: 12px 24px;
      background-color: ${hasRedFlag ? '#dc3545' : '#28a745'};
      color: white;
      text-decoration: none;
      border-radius: 4px;
      font-weight: 500;
    }
  </style>
</head>
<body>
  <div class="container">
    <h1>${title}</h1>
    <div class="alert">
      <p class="message">${message}</p>
    </div>

    ${hasRedFlag ? `
    <div class="cta">
      <a href="/comprehensive-care" class="btn">Find Professional Care</a>
    </div>
    ` : ''}

    <div class="disclaimer">
      Educational use only. Not a diagnosis or treatment.
      If symptoms worsen or new symptoms develop, seek medical care.
    </div>
  </div>
</body>
</html>`;
}