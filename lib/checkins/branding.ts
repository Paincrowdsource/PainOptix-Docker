import fs from 'fs'
import path from 'path'

/**
 * Resolves the logo HTML fragment with absolute URL for email compatibility
 * @param appUrl The application URL (e.g., https://painoptix.com)
 * @returns HTML fragment for the logo
 */
export function resolveLogoFragment(appUrl: string): string {
  // Check for logo file in public/branding
  const brandingDir = path.resolve(process.cwd(), 'public', 'branding')
  const candidates = ['painoptix-logo.png', 'painoptix-logo.jpg', 'painoptix-logo.jpeg', 'painoptix-logo.svg']

  for (const file of candidates) {
    const absolute = path.join(brandingDir, file)
    if (fs.existsSync(absolute)) {
      // Use absolute URL for email compatibility
      const logoUrl = `${appUrl}/branding/${file}`
      return `<img src="${logoUrl}" alt="PainOptix" width="148" style="display:block;height:auto;">`
    }
  }

  // Fallback to text if no logo found
  return `<span style="font-size:22px;font-weight:700;letter-spacing:0.06em;color:#0B5394;">PainOptix</span>`
}