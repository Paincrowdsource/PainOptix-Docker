import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { renderConfirmationHtml } from '@/lib/checkins/landingPage';
import { verify } from '@/lib/checkins/token';

describe('renderConfirmationHtml', () => {
  const secret = 'test-secret';

  beforeEach(() => {
    process.env.CHECKINS_TOKEN_SECRET = secret;
    process.env.NEXT_PUBLIC_APP_URL = 'https://app.painoptix.test/';
    delete process.env.FEATURE_BUNDLE_350;
  });

  afterEach(() => {
    delete process.env.FEATURE_BUNDLE_350;
    delete process.env.NEXT_PUBLIC_APP_URL;
  });

  it('renders better branch upsell CTAs', () => {
    const html = renderConfirmationHtml('better', 3, 'assessment-123');

    expect(html).toContain('href="https://app.painoptix.test/guide/assessment-123/upgrade?tier=enhanced&source=checkin_d3" class="btn primary"');
    expect(html).toContain('href="https://app.painoptix.test/guide/assessment-123/upgrade?tier=monograph&source=checkin_d3" class="btn secondary"');
  });

  it('renders same branch with enhanced upgrade and guide review CTAs', () => {
    const html = renderConfirmationHtml('same', 7, 'user-456');

    expect(html).toContain('href="https://app.painoptix.test/guide/user-456/upgrade?tier=enhanced&source=checkin_d7" class="btn primary"');
    expect(html).toContain('href="https://app.painoptix.test/guide/user-456?source=checkin_d7" class="btn secondary"');
  });

  it('renders worse branch consult CTA when comprehensive care is enabled', () => {
    process.env.FEATURE_BUNDLE_350 = 'true';
    const html = renderConfirmationHtml('worse', 14, 'alpha beta 42');
    const encodedId = encodeURIComponent('alpha beta 42');

    expect(html).toContain(`href="https://app.painoptix.test/comprehensive-care?assessment=${encodedId}&source=checkin_d14" class="btn secondary"`);
    expect(html).toContain('Schedule Comprehensive Support');
    expect(html).not.toContain("If you're still concerned");
  });

  it('provides safety follow-up guidance when comprehensive care is disabled', () => {
    const html = renderConfirmationHtml('worse', 14, 'consult-id');

    expect(html).toContain("If you're still concerned, use the note box below to tell us more. Remember, if symptoms escalate or feel urgent, please seek in-person medical care.");
    expect(html).not.toContain('mailto:');
    expect(html).not.toContain('Schedule Comprehensive Support');
  });

  it('signs note token payload for subsequent submissions', () => {
    const html = renderConfirmationHtml('same', 7, 'token-assessment');
    const match = html.match(/name="token" value="([^"]+)"/);
    expect(match).not.toBeNull();
    const decoded = verify(match![1]);
    expect(decoded).toEqual(expect.objectContaining({
      assessment_id: 'token-assessment',
      day: 7,
      value: 'same'
    }));
  });

  it('embeds JSON submission fetch script for note form', () => {
    const html = renderConfirmationHtml('better', 3, 'script-test');
    expect(html).toContain("fetch('/api/checkins/note', {\n            method: 'POST',\n            headers: {\n              'Content-Type': 'application/json'\n            },\n            body: JSON.stringify({ token, note })");
  });
});

