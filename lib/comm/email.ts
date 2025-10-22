import { sendEmail as sendEmailCore } from '@/lib/communications';

/**
 * Email adapter wrapper with HTML to plaintext conversion
 */
export async function sendEmail(to: string, subject: string, html: string): Promise<{ success: boolean; messageId?: string }> {
  // Convert HTML to plaintext with better formatting
  let text = html;

  // Remove style and script tags completely
  text = text.replace(/<style[^>]*>[\s\S]*?<\/style>/gi, '');
  text = text.replace(/<script[^>]*>[\s\S]*?<\/script>/gi, '');

  // Convert common HTML elements to text equivalents
  text = text.replace(/<h[1-6][^>]*>(.*?)<\/h[1-6]>/gi, '\n\n$1\n\n');
  text = text.replace(/<p[^>]*>(.*?)<\/p>/gi, '$1\n\n');
  text = text.replace(/<br[^>]*>/gi, '\n');
  text = text.replace(/<li[^>]*>(.*?)<\/li>/gi, '• $1\n');
  text = text.replace(/<hr[^>]*>/gi, '\n---\n');

  // Convert links to text format
  text = text.replace(/<a[^>]+href="([^"]+)"[^>]*>(.*?)<\/a>/gi, '$2 ($1)');

  // Remove remaining HTML tags
  text = text.replace(/<[^>]*>/g, '');

  // Clean up whitespace
  text = text.replace(/\n{3,}/g, '\n\n');
  text = text.replace(/[ \t]+/g, ' ');
  text = text.trim();

  // Add footer
  text += '\n\n---\nThis email was sent by PainOptix. To manage your preferences, visit your account settings.';

  return sendEmailCore({
    to,
    subject,
    html,
    text
  });
}