import { NextResponse } from 'next/server';
import { exec } from 'child_process';
import { promisify } from 'util';

const execAsync = promisify(exec);

export async function GET() {
  try {
    const results: any = {};
    
    // Check various chromium locations
    const paths = [
      '/usr/bin/chromium',
      '/usr/bin/chromium-browser',
      '/snap/bin/chromium',
      '/usr/lib/chromium/chromium',
      '/usr/lib/chromium-browser/chromium-browser',
    ];
    
    for (const path of paths) {
      try {
        const { stdout: exists } = await execAsync(`ls -la ${path} 2>/dev/null || echo "not found"`);
        results[path] = exists.trim();
      } catch (e) {
        results[path] = 'not found';
      }
    }
    
    // Check which chromium command
    try {
      const { stdout: which } = await execAsync('which chromium chromium-browser 2>/dev/null || echo "none found"');
      results.which = which.trim();
    } catch (e) {
      results.which = 'error';
    }
    
    // Check apt packages
    try {
      const { stdout: dpkg } = await execAsync('dpkg -l | grep chromium || echo "no chromium packages"');
      results.packages = dpkg.trim();
    } catch (e) {
      results.packages = 'error checking packages';
    }
    
    // Check environment variable
    results.env_PUPPETEER_EXECUTABLE_PATH = process.env.PUPPETEER_EXECUTABLE_PATH || 'not set';
    
    return NextResponse.json({
      success: true,
      chromium_paths: results
    });
  } catch (error: any) {
    return NextResponse.json({
      success: false,
      error: error.message
    }, { status: 500 });
  }
}