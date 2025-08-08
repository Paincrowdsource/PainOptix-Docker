import { NextRequest, NextResponse } from 'next/server';
import fs from 'fs/promises';
import path from 'path';
import { getGuideContent, isContentLoaded } from '@/lib/pdf/content-loader';

export async function GET(req: NextRequest) {
  const diagnostics: any = {
    environment: {
      NODE_ENV: process.env.NODE_ENV,
      cwd: process.cwd(),
      platform: process.platform,
      nodeVersion: process.version,
    },
    contentLoader: {
      isLoaded: isContentLoaded(),
      preloadedContent: {}
    },
    filesystem: {
      contentDirExists: false,
      guidesFound: [],
      sampleContent: null,
      error: null
    },
    chromium: {
      sparticuzAvailable: false,
      puppeteerCoreAvailable: false,
      error: null
    }
  };

  // Check pre-loaded content
  try {
    const testContent = getGuideContent('free', 'sciatica');
    diagnostics.contentLoader.preloadedContent = {
      free_sciatica: testContent ? `${testContent.substring(0, 100)}...` : null
    };
  } catch (e: any) {
    diagnostics.contentLoader.error = e.message;
  }

  // Check file system
  try {
    const contentPath = path.join(process.cwd(), 'content');
    await fs.access(contentPath);
    diagnostics.filesystem.contentDirExists = true;

    const guidesPath = path.join(contentPath, 'guides');
    const guideDirs = await fs.readdir(guidesPath);
    diagnostics.filesystem.guideDirs = guideDirs;

    // Try to read a sample file
    const samplePath = path.join(guidesPath, 'free', 'sciatica.md');
    try {
      const content = await fs.readFile(samplePath, 'utf-8');
      diagnostics.filesystem.sampleContent = {
        path: samplePath,
        size: content.length,
        preview: content.substring(0, 200)
      };
    } catch (e: any) {
      diagnostics.filesystem.sampleError = {
        path: samplePath,
        error: e.message
      };
    }

    // List all markdown files
    for (const dir of guideDirs) {
      try {
        const dirPath = path.join(guidesPath, dir);
        const files = await fs.readdir(dirPath);
        diagnostics.filesystem.guidesFound.push({
          tier: dir,
          files: files.filter(f => f.endsWith('.md'))
        });
      } catch (e) {
        // Skip if can't read directory
      }
    }
  } catch (e: any) {
    diagnostics.filesystem.error = e.message;
  }

  // Check Chromium/Puppeteer availability
  try {
    const chromium = require('@sparticuz/chromium');
    diagnostics.chromium.sparticuzAvailable = true;
    try {
      const execPath = await chromium.executablePath();
      diagnostics.chromium.executablePath = execPath;
      
      // Check if the path exists and what it is
      try {
        const stats = await fs.stat(execPath);
        diagnostics.chromium.pathInfo = {
          exists: true,
          isFile: stats.isFile(),
          isDirectory: stats.isDirectory(),
          size: stats.size
        };
        
        // If it's a directory, list its contents
        if (stats.isDirectory()) {
          const files = await fs.readdir(execPath);
          diagnostics.chromium.directoryContents = files.slice(0, 10); // First 10 files
        }
      } catch (statError: any) {
        diagnostics.chromium.pathInfo = {
          exists: false,
          error: statError.message
        };
      }
      
      // Check other possible Chrome locations
      const possiblePaths = [
        '/tmp/chromium/chrome',
        '/tmp/chromium/chrome-linux/chrome',
        '/usr/bin/chromium',
        '/usr/bin/chromium-browser',
        '/usr/bin/google-chrome'
      ];
      
      diagnostics.chromium.possiblePaths = {};
      for (const testPath of possiblePaths) {
        try {
          await fs.access(testPath);
          const stats = await fs.stat(testPath);
          diagnostics.chromium.possiblePaths[testPath] = {
            exists: true,
            isFile: stats.isFile(),
            size: stats.size
          };
        } catch (e) {
          diagnostics.chromium.possiblePaths[testPath] = { exists: false };
        }
      }
    } catch (e: any) {
      diagnostics.chromium.pathError = e.message;
    }
  } catch (e: any) {
    diagnostics.chromium.sparticuzError = e.message;
  }

  try {
    require('puppeteer-core');
    diagnostics.chromium.puppeteerCoreAvailable = true;
  } catch (e: any) {
    diagnostics.chromium.puppeteerError = e.message;
  }

  return NextResponse.json(diagnostics, { 
    status: 200,
    headers: {
      'Content-Type': 'application/json',
    }
  });
}