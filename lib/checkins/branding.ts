import fs from 'fs'
import path from 'path'

/**
 * Resolves the logo HTML fragment with absolute URL for email compatibility
 * @param appUrl The application URL (e.g., https://painoptix.com)
 * @returns HTML fragment for the logo
 */
function normalizeAppUrl(appUrl: string): string {
  if (!appUrl) {
    return 'https://painoptix.com'
  }

  const trimmed = appUrl.replace(/\/$/, '')

  if (/localhost|127\.0\.0\.1/i.test(trimmed)) {
    return 'https://painoptix.com'
  }

  return trimmed
}

const candidates = ['painoptix-logo.png', 'painoptix-logo.svg', 'painoptix-logo.jpg', 'painoptix-logo.jpeg']

function embedLogoIfRequested(filePath: string, style: string): string | null {
  if (process.env.CHECKINS_EMBED_LOGO !== '1') {
    return null
  }

  try {
    const ext = path.extname(filePath).toLowerCase()
    const type = ext === '.svg' ? 'image/svg+xml' : ext === '.jpg' || ext === '.jpeg' ? 'image/jpeg' : 'image/png'
    const data = fs.readFileSync(filePath).toString('base64')
    return `<img src="data:${type};base64,${data}" alt="PainOptix" width="190" style="${style}">`
  } catch (error) {
    console.warn('Failed to embed logo for preview:', (error as Error).message)
    return null
  }
}

export function resolveLogoFragment(appUrl: string): string {
  // Check for logo file in public/branding
  // Prefer transparent formats (PNG, SVG) over JPEG
  const brandingDir = path.resolve(process.cwd(), 'public', 'branding')

  for (const file of candidates) {
    const absolute = path.join(brandingDir, file)
    if (fs.existsSync(absolute)) {
      const style = 'display:block;height:auto;max-width:190px;margin:0 auto;'

      const embedded = embedLogoIfRequested(absolute, style)
      if (embedded) {
        return embedded
      }

      // Use absolute URL for email compatibility
      const baseUrl = normalizeAppUrl(appUrl)
      const logoUrl = `${baseUrl}/branding/${file}`
      return `<img src="${logoUrl}" alt="PainOptix" width="190" style="${style}">`
    }
  }

  // Fallback to text if no logo found
  return `<span style="font-size:28px;font-weight:700;letter-spacing:0.06em;color:#0B5394;">PainOptix</span>`
}