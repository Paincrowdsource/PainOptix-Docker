#!/usr/bin/env node

/**
 * enhanced-lint.js - Content linter for Enhanced tier markdown files
 * Scans for formatting issues that affect PDF generation:
 * - NBSPs (non-breaking spaces)
 * - <br> or &lt;br tags
 * - Inconsistent bullet formatting
 * - Split citations across lines
 */

const fs = require('fs');
const path = require('path');

// Color codes for terminal output
const colors = {
  reset: '\x1b[0m',
  red: '\x1b[31m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  gray: '\x1b[90m'
};

class EnhancedLinter {
  constructor() {
    this.issues = {};
    this.stats = {
      filesScanned: 0,
      totalIssues: 0,
      byType: {
        nbsp: 0,
        brTag: 0,
        bulletInconsistent: 0,
        citationSplit: 0
      }
    };
  }

  scanFile(filePath) {
    const fileName = path.basename(filePath);
    const content = fs.readFileSync(filePath, 'utf-8');
    const lines = content.split('\n');
    const fileIssues = [];

    console.log(`${colors.blue}Scanning: ${fileName}${colors.reset}`);

    // Check for NBSPs (non-breaking spaces - \u00A0)
    lines.forEach((line, idx) => {
      if (line.includes('\u00A0')) {
        const count = (line.match(/\u00A0/g) || []).length;
        fileIssues.push({
          type: 'nbsp',
          line: idx + 1,
          message: `Found ${count} NBSP character(s)`,
          preview: line.substring(0, 80).replace(/\u00A0/g, '[NBSP]')
        });
        this.stats.byType.nbsp += count;
      }
    });

    // Check for <br> or &lt;br tags
    lines.forEach((line, idx) => {
      if (/<br\s*\/?>|&lt;br\s*\/?>/.test(line)) {
        fileIssues.push({
          type: 'brTag',
          line: idx + 1,
          message: 'Found <br> or &lt;br tag',
          preview: line.substring(0, 80)
        });
        this.stats.byType.brTag++;
      }
    });

    // Check for inconsistent bullet formatting
    const bulletPatterns = [
      /^[-*•]\s+/,     // Standard markdown bullets
      /^[−]\s+/,       // En-dash bullet
      /^[–]\s+/,       // Em-dash bullet
      /^[·]\s+/        // Middle dot bullet
    ];
    
    lines.forEach((line, idx) => {
      const trimmed = line.trim();
      for (const pattern of bulletPatterns.slice(1)) {
        if (pattern.test(trimmed)) {
          fileIssues.push({
            type: 'bulletInconsistent',
            line: idx + 1,
            message: 'Non-standard bullet character (use - or *)',
            preview: line.substring(0, 80)
          });
          this.stats.byType.bulletInconsistent++;
        }
      }
    });

    // Check for split citations
    // Pattern: Author name followed by line break, then "et al." or year
    for (let i = 0; i < lines.length - 1; i++) {
      const currentLine = lines[i].trim();
      const nextLine = lines[i + 1].trim();
      
      // Check for split citation patterns
      if (/[A-Z][a-z]+$/.test(currentLine) && /^et al\.|^\d{4}/.test(nextLine)) {
        fileIssues.push({
          type: 'citationSplit',
          line: i + 1,
          message: 'Citation split across lines',
          preview: `${currentLine} | ${nextLine}`.substring(0, 80)
        });
        this.stats.byType.citationSplit++;
      }
      
      // Also check for parenthetical citations split across lines
      if (/\([A-Z][a-z]+$/.test(currentLine) && /^et al\.,?\s*\d{4}\)/.test(nextLine)) {
        fileIssues.push({
          type: 'citationSplit',
          line: i + 1,
          message: 'Parenthetical citation split across lines',
          preview: `${currentLine} | ${nextLine}`.substring(0, 80)
        });
        this.stats.byType.citationSplit++;
      }
    }

    if (fileIssues.length > 0) {
      this.issues[fileName] = fileIssues;
      this.stats.totalIssues += fileIssues.length;
    }

    this.stats.filesScanned++;
  }

  scanDirectory(dirPath) {
    if (!fs.existsSync(dirPath)) {
      console.error(`${colors.red}Error: Directory not found: ${dirPath}${colors.reset}`);
      return;
    }

    const files = fs.readdirSync(dirPath);
    const mdFiles = files.filter(f => f.endsWith('.md'));

    if (mdFiles.length === 0) {
      console.log(`${colors.yellow}No markdown files found in ${dirPath}${colors.reset}`);
      return;
    }

    console.log(`${colors.green}Enhanced Content Linter${colors.reset}`);
    console.log(`${colors.gray}Scanning ${mdFiles.length} files in ${dirPath}${colors.reset}\n`);

    mdFiles.forEach(file => {
      this.scanFile(path.join(dirPath, file));
    });
  }

  printReport() {
    console.log(`\n${colors.green}===== LINT REPORT =====${colors.reset}\n`);

    // Summary stats
    console.log(`Files scanned: ${this.stats.filesScanned}`);
    console.log(`Total issues: ${this.stats.totalIssues}\n`);

    if (this.stats.totalIssues === 0) {
      console.log(`${colors.green}✓ No issues found!${colors.reset}`);
      return;
    }

    // Issue breakdown
    console.log(`${colors.yellow}Issues by type:${colors.reset}`);
    if (this.stats.byType.nbsp > 0) {
      console.log(`  • NBSPs: ${this.stats.byType.nbsp}`);
    }
    if (this.stats.byType.brTag > 0) {
      console.log(`  • BR tags: ${this.stats.byType.brTag}`);
    }
    if (this.stats.byType.bulletInconsistent > 0) {
      console.log(`  • Inconsistent bullets: ${this.stats.byType.bulletInconsistent}`);
    }
    if (this.stats.byType.citationSplit > 0) {
      console.log(`  • Split citations: ${this.stats.byType.citationSplit}`);
    }

    // Per-file details
    console.log(`\n${colors.yellow}Details by file:${colors.reset}`);
    
    Object.entries(this.issues).forEach(([fileName, fileIssues]) => {
      console.log(`\n${colors.blue}${fileName}${colors.reset} (${fileIssues.length} issues)`);
      
      // Group by type for cleaner output
      const byType = {};
      fileIssues.forEach(issue => {
        if (!byType[issue.type]) byType[issue.type] = [];
        byType[issue.type].push(issue);
      });

      Object.entries(byType).forEach(([type, issues]) => {
        const typeLabel = {
          nbsp: 'NBSP',
          brTag: 'BR Tag',
          bulletInconsistent: 'Bullet',
          citationSplit: 'Citation'
        }[type];

        console.log(`  ${colors.yellow}[${typeLabel}]${colors.reset}`);
        issues.slice(0, 3).forEach(issue => {
          console.log(`    Line ${issue.line}: ${issue.message}`);
          if (issue.preview) {
            console.log(`    ${colors.gray}→ ${issue.preview}${colors.reset}`);
          }
        });
        if (issues.length > 3) {
          console.log(`    ${colors.gray}... and ${issues.length - 3} more${colors.reset}`);
        }
      });
    });

    console.log(`\n${colors.green}===== END REPORT =====${colors.reset}`);
  }
}

// Main execution
function main() {
  const linter = new EnhancedLinter();
  
  // Check both possible locations for enhanced content
  const dockerRepoPath = path.join(process.cwd(), 'docker-repo', 'content', 'guides', 'enhanced');
  const contentPath = path.join(process.cwd(), 'content', 'guides', 'enhanced');
  
  let targetPath;
  if (fs.existsSync(dockerRepoPath)) {
    targetPath = dockerRepoPath;
    console.log(`Using docker-repo content at: ${dockerRepoPath}\n`);
  } else if (fs.existsSync(contentPath)) {
    targetPath = contentPath;
    console.log(`Using local content at: ${contentPath}\n`);
  } else {
    console.error(`${colors.red}Error: Enhanced content directory not found${colors.reset}`);
    console.error(`Looked in:`);
    console.error(`  - ${dockerRepoPath}`);
    console.error(`  - ${contentPath}`);
    process.exit(1);
  }

  linter.scanDirectory(targetPath);
  linter.printReport();
}

main();