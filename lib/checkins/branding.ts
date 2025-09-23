import fs from 'fs'
import path from 'path'

/**
 * Resolves the logo HTML fragment with absolute URL for email compatibility
 * @param appUrl The application URL (e.g., https://painoptix.com)
 * @returns HTML fragment for the logo
 */
export function resolveLogoFragment(appUrl: string): string {
  // Check for logo file in public/branding
  // Prefer transparent formats (PNG, SVG) over JPEG
  const brandingDir = path.resolve(process.cwd(), 'public', 'branding')
  const candidates = ['painoptix-logo.png', 'painoptix-logo.svg', 'painoptix-logo.jpg', 'painoptix-logo.jpeg']

  for (const file of candidates) {
    const absolute = path.join(brandingDir, file)
    if (fs.existsSync(absolute)) {
      // Use absolute URL for email compatibility
      const logoUrl = `${appUrl}/branding/${file}`
      return `<img src="${logoUrl}" alt="PainOptix" width="200" style="display:inline-block;height:auto;max-width:200px;">`
    }
  }

  // Fallback to text if no logo found
  return `<span style="font-size:28px;font-weight:700;letter-spacing:0.06em;color:#0B5394;">PainOptix</span>`
}