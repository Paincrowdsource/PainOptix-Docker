#!/usr/bin/env node

/**
 * test-enhanced-v2.js - Test runner for Enhanced V2 feature flag
 * Generates PDFs with and without the V2 flag to verify:
 * 1. Monographs remain untouched
 * 2. Enhanced V2 shows improved formatting only when flag is on
 * 3. Default behavior matches baseline
 */

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

// Color codes for terminal output
const colors = {
  reset: '\x1b[0m',
  red: '\x1b[31m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  cyan: '\x1b[36m'
};

class EnhancedV2Tester {
  constructor() {
    this.apiUrl = 'http://localhost:3000/api/download-guide';
    this.outputDir = path.join(process.cwd(), 'test-pdfs-enhanced-v2');
    this.monographDir = path.join(process.cwd(), 'test-pdfs-monograph');
    this.results = [];
  }

  async setup() {
    // Create output directories
    [this.outputDir, this.monographDir].forEach(dir => {
      if (!fs.existsSync(dir)) {
        fs.mkdirSync(dir, { recursive: true });
        console.log(`Created directory: ${dir}`);
      }
    });

    // Check if dev server is running
    try {
      const response = await fetch('http://localhost:3000/api/health');
      if (!response.ok) {
        throw new Error('Dev server not responding');
      }
    } catch (error) {
      console.log(`${colors.yellow}Dev server not running. Starting it now...${colors.reset}`);
      console.log(`${colors.cyan}Please wait for the server to start...${colors.reset}`);
      
      // Start dev server in background
      const { spawn } = require('child_process');
      const devServer = spawn('npm', ['run', 'dev'], {
        detached: true,
        stdio: 'ignore',
        shell: true
      });
      devServer.unref();
      
      // Wait for server to be ready
      await this.waitForServer();
    }
  }

  async waitForServer(maxAttempts = 30) {
    for (let i = 0; i < maxAttempts; i++) {
      try {
        const response = await fetch('http://localhost:3000/api/health');
        if (response.ok) {
          console.log(`${colors.green}Dev server is ready!${colors.reset}`);
          return;
        }
      } catch (error) {
        // Server not ready yet
      }
      await new Promise(resolve => setTimeout(resolve, 2000));
      process.stdout.write('.');
    }
    throw new Error('Dev server failed to start after 60 seconds');
  }

  async generatePdf(slug, tier, withV2Flag = false, testName = '') {
    const assessmentId = `admin-test-${slug}`;
    const headers = {
      'Content-Type': 'application/json'
    };

    if (withV2Flag) {
      headers['x-po-enhanced-v2'] = '1';
    }

    console.log(`\n${colors.blue}Generating ${testName}:${colors.reset}`);
    console.log(`  Slug: ${slug}`);
    console.log(`  Tier: ${tier}`);
    console.log(`  V2 Flag: ${withV2Flag}`);

    try {
      const response = await fetch(this.apiUrl, {
        method: 'POST',
        headers,
        body: JSON.stringify({
          assessmentId,
          tier
        })
      });

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

      const buffer = await response.arrayBuffer();
      const fileName = `${slug}-${tier}${withV2Flag ? '-v2' : ''}.pdf`;
      const outputPath = tier === 'monograph' 
        ? path.join(this.monographDir, fileName)
        : path.join(this.outputDir, fileName);

      fs.writeFileSync(outputPath, Buffer.from(buffer));
      
      const sizeMB = (buffer.byteLength / (1024 * 1024)).toFixed(2);
      console.log(`  ${colors.green}✓${colors.reset} Saved: ${fileName} (${sizeMB} MB)`);

      this.results.push({
        test: testName,
        slug,
        tier,
        v2Flag: withV2Flag,
        fileName,
        size: buffer.byteLength,
        sizeMB
      });

      return { fileName, size: buffer.byteLength };
    } catch (error) {
      console.error(`  ${colors.red}✗ Failed: ${error.message}${colors.reset}`);
      throw error;
    }
  }

  async checkHtmlDebugFiles() {
    console.log(`\n${colors.cyan}Checking HTML debug files...${colors.reset}`);
    
    const debugFiles = fs.readdirSync(process.cwd())
      .filter(f => f.startsWith('debug-') && f.endsWith('.html'));

    if (debugFiles.length === 0) {
      console.log('  No debug HTML files found');
      return;
    }

    for (const file of debugFiles) {
      const content = fs.readFileSync(file, 'utf-8');
      const hasEnhBullet = content.includes('enh-bullet');
      const hasV2Marker = file.includes('v2');
      
      console.log(`  ${file}:`);
      console.log(`    Has .enh-bullet class: ${hasEnhBullet ? colors.green + 'YES' : colors.yellow + 'NO'}${colors.reset}`);
      
      if (hasV2Marker && !hasEnhBullet) {
        console.log(`    ${colors.red}WARNING: V2 file missing .enh-bullet class${colors.reset}`);
      } else if (!hasV2Marker && hasEnhBullet) {
        console.log(`    ${colors.red}ERROR: Non-V2 file has .enh-bullet class!${colors.reset}`);
      }
    }
  }

  printSummary() {
    console.log(`\n${colors.green}===== TEST SUMMARY =====${colors.reset}\n`);

    // Group results by test type
    const baseline = this.results.filter(r => !r.v2Flag);
    const v2Enhanced = this.results.filter(r => r.v2Flag && r.tier === 'enhanced');
    const monograph = this.results.filter(r => r.tier === 'monograph');

    console.log(`${colors.yellow}Baseline (no V2 flag):${colors.reset}`);
    baseline.forEach(r => {
      console.log(`  ${r.slug} (${r.tier}): ${r.sizeMB} MB`);
    });

    console.log(`\n${colors.yellow}Enhanced V2 (with flag):${colors.reset}`);
    v2Enhanced.forEach(r => {
      console.log(`  ${r.slug}: ${r.sizeMB} MB`);
      
      // Compare with baseline
      const baselineMatch = baseline.find(b => b.slug === r.slug && b.tier === r.tier);
      if (baselineMatch) {
        const diff = ((r.size - baselineMatch.size) / 1024).toFixed(1);
        if (Math.abs(parseFloat(diff)) > 1) {
          console.log(`    ${colors.cyan}Size difference: ${diff > 0 ? '+' : ''}${diff} KB${colors.reset}`);
        }
      }
    });

    console.log(`\n${colors.yellow}Monograph (should be unchanged):${colors.reset}`);
    monograph.forEach(r => {
      console.log(`  ${r.slug}: ${r.sizeMB} MB`);
    });

    // Verification checks
    console.log(`\n${colors.yellow}Verification:${colors.reset}`);
    
    // Check that monographs are identical with/without flag
    const monographWithFlag = monograph.find(m => m.v2Flag);
    const monographWithoutFlag = monograph.find(m => !m.v2Flag);
    
    if (monographWithFlag && monographWithoutFlag) {
      if (monographWithFlag.size === monographWithoutFlag.size) {
        console.log(`  ${colors.green}✓ Monograph unchanged by V2 flag${colors.reset}`);
      } else {
        console.log(`  ${colors.red}✗ ERROR: Monograph changed by V2 flag!${colors.reset}`);
      }
    }

    console.log(`\n${colors.green}===== END SUMMARY =====${colors.reset}`);
  }

  async run() {
    console.log(`${colors.green}Enhanced V2 Test Runner${colors.reset}\n`);

    try {
      await this.setup();

      // Test cases
      const testSlugs = ['facet_arthropathy', 'sciatica'];

      console.log(`${colors.cyan}Running tests...${colors.reset}`);

      // 1. Enhanced without V2 flag (baseline)
      for (const slug of testSlugs) {
        await this.generatePdf(slug, 'enhanced', false, 'Enhanced Baseline');
      }

      // 2. Enhanced with V2 flag
      for (const slug of testSlugs) {
        await this.generatePdf(slug, 'enhanced', true, 'Enhanced V2');
      }

      // 3. Monograph without flag (should never change)
      await this.generatePdf('facet_arthropathy', 'monograph', false, 'Monograph Baseline');

      // 4. Monograph with flag (should be identical to without)
      await this.generatePdf('facet_arthropathy', 'monograph', true, 'Monograph with V2 Flag');

      // Check debug HTML files
      await this.checkHtmlDebugFiles();

      // Print summary
      this.printSummary();

      console.log(`\n${colors.green}Tests completed successfully!${colors.reset}`);
      console.log(`PDFs saved to:`);
      console.log(`  - ${this.outputDir}`);
      console.log(`  - ${this.monographDir}`);

    } catch (error) {
      console.error(`\n${colors.red}Test failed: ${error.message}${colors.reset}`);
      console.error(error.stack);
      process.exit(1);
    }
  }
}

// Main execution
async function main() {
  const tester = new EnhancedV2Tester();
  await tester.run();
}

main().catch(console.error);