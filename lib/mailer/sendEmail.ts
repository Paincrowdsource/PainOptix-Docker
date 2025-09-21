/**
 * SendGrid mailer for check-ins.
 * Uses @sendgrid/mail when SENDGRID_API_KEY is present.
 * Falls back to console log so builds never fail in dev.
 */
export type SendEmailOptions = {
  to: string | string[];
  subject: string;
  html?: string;
  text?: string;
  from?: string;
};

export async function sendEmail(opts: SendEmailOptions): Promise<{ ok: boolean; id?: string; provider?: string; error?: string }> {
  const key = process.env.SENDGRID_API_KEY;
  const from = opts.from || process.env.EMAIL_FROM || 'PainOptix <no-reply@painoptix.com>';
  const to = Array.isArray(opts.to) ? opts.to : [opts.to];

  if (key) {
    try {
      const sg = (await import('@sendgrid/mail')) as typeof import('@sendgrid/mail');
      sg.setApiKey(key);
      const [resp, body] = await sg.send({
        from,
        to,
        subject: opts.subject,
        html: opts.html,
        text: opts.text,
      });
      if (resp.statusCode >= 200 && resp.statusCode < 300) {
        const id = resp.headers['x-message-id'] || (Array.isArray(body) ? body[0]?.id : body?.id);
        return { ok: true, provider: 'sendgrid', id };
      }
      return { ok: false, provider: 'sendgrid', error: `HTTP ${resp.statusCode}` };
    } catch (err: any) {
      return { ok: false, provider: 'sendgrid', error: err?.message || String(err) };
    }
  }

  // Fallback: log only (keeps pilot/dev builds green without provider)
  try {
    // eslint-disable-next-line no-console
    console.log('[mailer:console]', { to, from, subject: opts.subject });
    return { ok: true, provider: 'console' };
  } catch (err: any) {
    return { ok: false, provider: 'console', error: err?.message || String(err) };
  }
}

export default sendEmail;
