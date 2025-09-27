import { sign } from '@/lib/checkins/token';
import { sourceTag } from '@/lib/checkins/attribution';

export function renderConfirmationHtml(
  value: 'better' | 'same' | 'worse',
  day: number,
  assessmentId: string,
  userTier: 'free' | 'enhanced' | 'comprehensive' = 'free'
): string {
  const appUrl = process.env.NEXT_PUBLIC_APP_URL || 'https://painoptix.com';
  const normalizedAppUrl = appUrl.replace(/\/$/, '');

  const noteToken = sign({
    assessment_id: assessmentId,
    day: day as 3 | 7 | 14,
    value: value as 'better' | 'same' | 'worse'
  });

  const source = sourceTag(day as 3 | 7 | 14);
  const encodedAssessmentId = encodeURIComponent(assessmentId);
  const encodedSource = encodeURIComponent(source);

  const guideUrl = `${normalizedAppUrl}/guide/${encodedAssessmentId}?source=${encodedSource}`;
  const enhancedUpgradeUrl = `${normalizedAppUrl}/guide/${encodedAssessmentId}/upgrade?tier=enhanced&source=${encodedSource}`;
  const monographUpgradeUrl = `${normalizedAppUrl}/guide/${encodedAssessmentId}/upgrade?tier=monograph&source=${encodedSource}`;
  const consultUrl = `${normalizedAppUrl}/comprehensive-care?assessment=${encodedAssessmentId}&source=${encodedSource}`;
  const logoUrl = `${normalizedAppUrl}/branding/painoptix_logo_bg_removed.png`;

  let title = '';
  let message = '';
  let ctaButtons = '';
  let followUpCopy = '';

  // Generate purchase-aware CTAs based on user's response and existing tier
  if (value === 'better') {
    title = 'Great to hear!';

    if (userTier === 'free') {
      message = `Great to hear you're feeling better on day ${day}. Keep the momentum going with a deeper plan.`;
      ctaButtons = `
        <a href="${enhancedUpgradeUrl}" class="btn primary">Upgrade to the Enhanced Guide ($5)</a>
        <a href="${monographUpgradeUrl}" class="btn secondary">Get the Complete Monograph ($20)</a>
      `;
    } else if (userTier === 'enhanced') {
      message = `Great to hear you're feeling better on day ${day}. Consider our comprehensive monograph for even deeper insights.`;
      ctaButtons = `
        <a href="${monographUpgradeUrl}" class="btn primary">Get the Complete Monograph ($20)</a>
        <a href="${guideUrl}" class="btn secondary">View Your Enhanced Guide</a>
      `;
    } else {
      // comprehensive tier - they have everything
      message = `Great to hear you're feeling better on day ${day}. You're on the right track with your comprehensive guide.`;
      ctaButtons = `
        <a href="${guideUrl}" class="btn primary">View Your Comprehensive Guide</a>
      `;
      if (process.env.FEATURE_BUNDLE_350 === 'true') {
        ctaButtons += `
        <a href="${consultUrl}" class="btn secondary">Schedule Comprehensive Support</a>`;
      }
    }
  } else if (value === 'same') {
    title = 'Thanks for checking in';

    if (userTier === 'free') {
      message = `Plateaus are normal around day ${day}. Our enhanced upgrade adds step-by-step strategies to help you break through.`;
      ctaButtons = `
        <a href="${enhancedUpgradeUrl}" class="btn primary">Unlock the Enhanced Guide</a>
        <a href="${guideUrl}" class="btn secondary">View Your Current Guide</a>
      `;
    } else if (userTier === 'enhanced') {
      message = `Plateaus are normal around day ${day}. The comprehensive monograph offers additional strategies and professional illustrations.`;
      ctaButtons = `
        <a href="${monographUpgradeUrl}" class="btn primary">Upgrade to the Monograph ($20)</a>
        <a href="${guideUrl}" class="btn secondary">Review Your Enhanced Guide</a>
      `;
    } else {
      // comprehensive tier
      message = `Plateaus are normal around day ${day}. Review your comprehensive guide for advanced strategies.`;
      ctaButtons = `
        <a href="${guideUrl}" class="btn primary">Review Your Comprehensive Guide</a>
      `;
      if (process.env.FEATURE_BUNDLE_350 === 'true') {
        ctaButtons += `
        <a href="${consultUrl}" class="btn secondary">Consider Professional Support</a>`;
      }
    }
  } else {
    // value === 'worse'
    title = 'We hear you';
    const hasBundle = process.env.FEATURE_BUNDLE_350 === 'true';

    if (userTier === 'free') {
      message = `If things feel tougher by day ${day}, the comprehensive monograph goes deeper and includes professional illustrations to guide next steps.`;
      ctaButtons = `
        <a href="${monographUpgradeUrl}" class="btn primary">Get the Comprehensive Monograph</a>
        ${hasBundle ? `<a href="${consultUrl}" class="btn secondary">Schedule Comprehensive Support</a>` : ''}
      `;
    } else if (userTier === 'enhanced') {
      message = `If things feel tougher by day ${day}, the comprehensive monograph includes professional illustrations and deeper guidance.`;
      ctaButtons = `
        <a href="${monographUpgradeUrl}" class="btn primary">Upgrade to the Full Monograph</a>
        ${hasBundle ? `<a href="${consultUrl}" class="btn secondary">Schedule Comprehensive Support</a>` : ''}
      `;
    } else {
      // comprehensive tier - focus on support
      message = `If things feel tougher by day ${day}, review your comprehensive guide carefully. Consider professional support if symptoms persist.`;
      ctaButtons = hasBundle ? `
        <a href="${consultUrl}" class="btn primary">Schedule Comprehensive Support</a>
        <a href="${guideUrl}" class="btn secondary">Review Your Comprehensive Guide</a>
      ` : `
        <a href="${guideUrl}" class="btn primary">Review Your Comprehensive Guide</a>
      `;
    }

    followUpCopy = (hasBundle && userTier !== 'comprehensive') ? '' : `
      <p class="follow-up">If you're still concerned, use the note box below to tell us more. Remember, if symptoms escalate or feel urgent, please seek in-person medical care.</p>
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
      color: #445B78;
      min-height: 100vh;
      display: flex;
      align-items: flex-start;
      justify-content: center;
      padding: 48px 16px 64px;
      background: linear-gradient(180deg, #f6f9ff 0%, #eef2f9 100%);
    }
    .container {
      background: #ffffff;
      border-radius: 16px;
      box-shadow: 0 24px 48px rgba(11, 83, 148, 0.12);
      padding: 48px;
      max-width: 640px;
      width: 100%;
    }
    .logo {
      display: flex;
      justify-content: center;
      align-items: center;
      margin: 0 auto 32px;
      height: 180px;
    }
    .logo img {
      height: auto;
      max-height: 180px;
      width: auto;
    }
    h1 {
      font-size: 32px;
      font-weight: 700;
      color: #0B5394;
      text-align: center;
      margin: 0 0 16px;
    }
    .message {
      font-size: 18px;
      color: #445B78;
      text-align: center;
      margin: 0 auto 32px;
      max-width: 520px;
    }
    .buttons {
      display: flex;
      justify-content: center;
      gap: 12px;
      flex-wrap: wrap;
      margin: 32px 0 24px;
    }
    .btn {
      display: inline-flex;
      align-items: center;
      justify-content: center;
      padding: 14px 28px;
      border-radius: 999px;
      font-weight: 600;
      text-decoration: none;
      transition: background-color 0.2s ease, color 0.2s ease, border-color 0.2s ease, box-shadow 0.2s ease;
      border: 1px solid transparent;
    }
    .btn.primary {
      background-color: #0B5394;
      color: #ffffff;
      border-color: #0B5394;
    }
    .btn.primary:hover {
      background-color: #093b72;
      border-color: #093b72;
    }
    .btn.secondary {
      background-color: transparent;
      color: #0B5394;
      border-color: #0B5394;
    }
    .btn.secondary:hover {
      background-color: rgba(11, 83, 148, 0.08);
    }
    .follow-up {
      font-size: 15px;
      color: #445B78;
      text-align: center;
      max-width: 520px;
      margin: -8px auto 32px;
    }
    .note-section {
      background: rgba(11, 83, 148, 0.04);
      border-radius: 12px;
      border: 1px solid rgba(11, 83, 148, 0.1);
      padding: 24px;
      margin: 32px 0;
    }
    .note-section h3 {
      margin-top: 0;
      margin-bottom: 12px;
      color: #0B5394;
    }
    .note-section p {
      font-size: 14px;
      color: #445B78;
      margin-bottom: 16px;
    }
    .note-form textarea {
      width: 100%;
      padding: 12px;
      border: 1px solid rgba(11, 83, 148, 0.2);
      border-radius: 10px;
      font-size: 14px;
      resize: vertical;
      min-height: 100px;
      font-family: inherit;
      transition: border-color 0.2s ease, box-shadow 0.2s ease;
      background: #ffffff;
    }
    .note-form textarea:focus {
      border-color: #0B5394;
      box-shadow: 0 0 0 3px rgba(11, 83, 148, 0.16);
      outline: none;
    }
    .note-submit {
      margin-top: 14px;
      display: inline-flex;
      align-items: center;
      justify-content: center;
      padding: 12px 24px;
      border-radius: 999px;
      font-weight: 600;
      background: transparent;
      color: #0B5394;
      border: 1px solid #0B5394;
      cursor: pointer;
      transition: background-color 0.2s ease, color 0.2s ease, border-color 0.2s ease;
    }
    .note-submit:hover {
      background: rgba(11, 83, 148, 0.08);
    }
    .note-submit:disabled {
      opacity: 0.6;
      cursor: not-allowed;
    }
    .note-response {
      margin-top: 12px;
      font-size: 14px;
      color: #445B78;
      min-height: 18px;
    }
    .note-response.success {
      color: #2c7a4b;
    }
    .note-response.error {
      color: #b02a37;
    }
    .note-response.pending {
      color: #0B5394;
    }
    .disclaimer {
      margin-top: 40px;
      font-size: 13px;
      color: #5E6B7E;
      text-align: center;
      border-top: 1px solid rgba(11, 83, 148, 0.08);
      padding-top: 20px;
    }
    @media (max-width: 600px) {
      .container {
        padding: 32px 24px;
      }
      .buttons {
        gap: 10px;
      }
    }
  </style>
</head>
<body>
  <div class="container">
    <div class="logo"><img src="${logoUrl}" alt="PainOptix" /></div>
    <h1>${title}</h1>
    <p class="message">${message}</p>

    <div class="buttons">
      ${ctaButtons}
    </div>
    ${followUpCopy}

    <div class="note-section">
      <h3>Additional Notes (Optional)</h3>
      <p>If you'd like to share any additional information about your condition, please let us know below.</p>
      <form class="note-form">
        <input type="hidden" name="token" value="${noteToken}">
        <textarea
          name="note"
          maxlength="280"
          placeholder="Share any changes, concerns, or observations..."
        ></textarea>
        <button type="submit" class="note-submit">Submit Note</button>
        <div id="note-response" class="note-response"></div>
      </form>
    </div>

    <div class="disclaimer">
      ${disclaimer}
    </div>
  </div>
  <script>
    (function() {
      const form = document.querySelector('.note-form');
      if (!form) return;
      const textarea = form.querySelector('textarea');
      const submitButton = form.querySelector('button[type="submit"]');
      const responseEl = document.getElementById('note-response');

      form.addEventListener('submit', async (event) => {
        event.preventDefault();
        if (!textarea || !responseEl || !submitButton) {
          return;
        }

        const note = textarea.value.trim();
        if (!note) {
          responseEl.textContent = 'Please enter a note before submitting (280 characters max).';
          responseEl.className = 'note-response error';
          return;
        }

        const tokenInput = form.querySelector('input[name="token"]');
        const token = tokenInput ? tokenInput.value : '';

        submitButton.disabled = true;
        responseEl.textContent = 'Sending...';
        responseEl.className = 'note-response pending';

        try {
          const res = await fetch('/api/checkins/note', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json'
            },
            body: JSON.stringify({ token, note })
          });

          const data = await res.json();
          if (!res.ok || !data || data.ok !== true) {
            throw new Error(data && data.error ? data.error : 'unable_to_submit');
          }

          textarea.value = '';
          responseEl.textContent = data.message || 'Note received. Thank you!';
          responseEl.className = 'note-response success';
        } catch (error) {
          responseEl.textContent = 'We could not save your note right now. Please try again soon.';
          responseEl.className = 'note-response error';
        } finally {
          submitButton.disabled = false;
        }
      });
    })();
  </script>
</body>
</html>`;
}








