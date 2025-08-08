import puppeteer, { Browser, Page, LaunchOptions } from 'puppeteer-core';
import fs from 'fs';

// Try to find chromium executable in common locations
function findChromium(): string | undefined {
  const possiblePaths = [
    '/usr/bin/chromium',
    '/usr/bin/chromium-browser',
    '/snap/bin/chromium',
    '/usr/lib/chromium/chromium',
    '/usr/lib/chromium-browser/chromium-browser',
  ];
  
  for (const path of possiblePaths) {
    if (fs.existsSync(path)) {
      console.log(`Found chromium at: ${path}`);
      return path;
    }
  }
  
  console.warn('Chromium not found in common paths, using puppeteer default');
  return undefined;
}

// Puppeteer configuration optimized for DigitalOcean and Docker
export const PUPPETEER_CONFIG: LaunchOptions = {
  headless: 'new' as any, // Use new headless mode which is more stable
  args: [
    '--no-sandbox',
    '--disable-setuid-sandbox',
    '--disable-dev-shm-usage',
    '--disable-gpu',
    '--no-first-run',
    '--no-zygote',
    '--disable-blink-features=AutomationControlled',
  ],
  executablePath: process.env.PUPPETEER_EXECUTABLE_PATH || findChromium(),
  // Increase timeout for slower containers
  timeout: 60000,
  // Prevent memory leaks
  dumpio: false,
  // Use pipe instead of WebSocket for better stability
  pipe: true,
};

// PDF generation options optimized for medical documents
export const PDF_OPTIONS = {
  format: 'A4' as const,
  printBackground: true,
  displayHeaderFooter: false,
  margin: {
    top: '0.75in',
    bottom: '0.75in',
    left: '0.75in',
    right: '0.75in',
  },
  preferCSSPageSize: false,
  // Timeout for PDF generation
  timeout: 120000,
};

// Page configuration for PDF rendering
export async function configurePage(page: Page): Promise<void> {
  // Set viewport for consistent rendering
  await page.setViewport({
    width: 1200,
    height: 1600,
    deviceScaleFactor: 2, // Higher quality rendering
  });

  // Set default navigation timeout
  page.setDefaultNavigationTimeout(60000);
  page.setDefaultTimeout(30000);

  // Inject custom error handling
  page.on('error', (err) => {
    console.error('Puppeteer page error:', err);
  });

  page.on('pageerror', (err) => {
    console.error('Page JavaScript error:', err);
  });

  // Handle console messages for debugging
  if (process.env.NODE_ENV === 'development') {
    page.on('console', (msg) => {
      console.log('Browser console:', msg.text());
    });
  }
}

// Browser pool for reusing browser instances
class BrowserPool {
  private browser: Browser | null = null;
  private lastUsed: number = 0;
  private readonly MAX_IDLE_TIME = 5 * 60 * 1000; // 5 minutes

  async getBrowser(): Promise<Browser> {
    const now = Date.now();
    
    // Close browser if idle for too long
    if (this.browser && (now - this.lastUsed) > this.MAX_IDLE_TIME) {
      await this.closeBrowser();
    }

    // Launch new browser if needed
    if (!this.browser || !this.browser.isConnected()) {
      console.log('Launching new Puppeteer browser instance...');
      this.browser = await puppeteer.launch(PUPPETEER_CONFIG);
    }

    this.lastUsed = now;
    return this.browser;
  }

  async closeBrowser(): Promise<void> {
    if (this.browser) {
      try {
        await this.browser.close();
      } catch (error) {
        console.error('Error closing browser:', error);
      }
      this.browser = null;
    }
  }
}

// Export singleton browser pool
export const browserPool = new BrowserPool();

// Cleanup on process termination
if (typeof process !== 'undefined') {
  process.on('SIGINT', async () => {
    await browserPool.closeBrowser();
    process.exit(0);
  });

  process.on('SIGTERM', async () => {
    await browserPool.closeBrowser();
    process.exit(0);
  });
}