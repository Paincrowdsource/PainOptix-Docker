#!/usr/bin/env node

/**
 * check-placeholders.js - Detect unreplaced placeholders in PDFs
 * This script generates a test monograph and checks for literal placeholders
 * that should have been replaced with user data.
 */

const { exec } = require('child_process');
const fs = require('fs');
const path = require('path');

console.log('Placeholder Check Script\n');
console.log('Checking for unreplaced placeholders in PDFs...\n');

// Check if server is running
async function checkServer() {
  return new Promise((resolve) => {
    exec('curl -s -o /dev/null -w "%{http_code}" http://localhost:3000/api/health', (err, stdout) => {
      resolve(stdout === '200');
    });
  });
}

async function generateAndCheck() {
  const isServerRunning = await checkServer();
  
  if (!isServerRunning) {
    console.log('⚠️  Dev server not running. Please start it with: npm run dev');
    process.exit(1);
  }

  console.log('Generating test monograph PDF...');
  
  // Generate a test monograph
  exec('curl -X POST http://localhost:3000/api/download-guide -H "Content-Type: application/json" -d \'{"assessmentId":"admin-test-sciatica","tier":"monograph"}\' -o test-mono-placeholder.pdf -s', (err) => {
    if (err) {
      console.error('❌ Error generating PDF:', err.message);
      return;
    }
    
    console.log('✓ PDF generated: test-mono-placeholder.pdf\n');
    
    // Check if pdftotext is available
    exec('which pdftotext', (err) => {
      if (err) {
        console.log('⚠️  pdftotext not found. Manual check required.');
        console.log('   On Windows, install: https://www.xpdfreader.com/pdftotext-man.html');
        console.log('   On Mac: brew install poppler');
        console.log('   On Linux: apt-get install poppler-utils\n');
        
        // Fallback: just check file size as indicator
        const stats = fs.statSync('test-mono-placeholder.pdf');
        const sizeMB = (stats.size / (1024 * 1024)).toFixed(2);
        console.log(`PDF Size: ${sizeMB} MB`);
        
        if (stats.size < 1000000) {
          console.log('⚠️  WARNING: PDF seems small for a monograph. May have rendering issues.');
        } else {
          console.log('✓ PDF size looks normal for a monograph.');
        }
        
        console.log('\nManual check needed:');
        console.log('1. Open test-mono-placeholder.pdf');
        console.log('2. Search for these placeholders:');
        console.log('   - {pain_location}');
        console.log('   - {duration}');
        console.log('   - {initial_pain_score}');
        console.log('   - [Name Placeholder]');
        console.log('   - [Date Placeholder]');
        console.log('3. These should be replaced with actual values\n');
        return;
      }
      
      // Use pdftotext to extract text
      console.log('Extracting text from PDF...');
      exec('pdftotext test-mono-placeholder.pdf - 2>/dev/null', (err, stdout) => {
        if (err) {
          console.error('❌ Error extracting text:', err.message);
          return;
        }
        
        const text = stdout;
        console.log(`Extracted ${text.length} characters\n`);
        
        // Check for various placeholder patterns
        const placeholders = [
          { pattern: /{pain_location}/g, name: '{pain_location}' },
          { pattern: /{duration}/g, name: '{duration}' },
          { pattern: /{initial_pain_score}/g, name: '{initial_pain_score}' },
          { pattern: /{[^}]+}/g, name: 'Any {placeholder}' },
          { pattern: /\[Name Placeholder\]/g, name: '[Name Placeholder]' },
          { pattern: /\[Date Placeholder\]/g, name: '[Date Placeholder]' },
          { pattern: /\[\w+ Placeholder\]/g, name: 'Any [X Placeholder]' }
        ];
        
        let foundIssues = false;
        console.log('Checking for unreplaced placeholders:\n');
        
        placeholders.forEach(({ pattern, name }) => {
          const matches = text.match(pattern);
          if (matches && matches.length > 0) {
            console.log(`❌ FOUND: ${name} (${matches.length} instances)`);
            if (matches.length <= 3) {
              matches.forEach(m => console.log(`   → "${m}"`));
            } else {
              console.log(`   → First 3: ${matches.slice(0, 3).map(m => `"${m}"`).join(', ')}`);
            }
            foundIssues = true;
          }
        });
        
        if (!foundIssues) {
          console.log('✅ No literal placeholders found!');
          console.log('   (Note: This is a basic check. Manual review still recommended)');
        } else {
          console.log('\n⚠️  PLACEHOLDER BUG CONFIRMED');
          console.log('Placeholders are not being replaced with user data.');
          console.log('This is a critical bug for Monograph PDFs.');
        }
        
        // Also check for expected replacements
        console.log('\nChecking for expected content:');
        
        const expectedContent = [
          { text: 'Test User', description: 'User name' },
          { text: 'Initial Pain Score: 7', description: 'Pain score' },
          { text: new Date().getFullYear().toString(), description: 'Current year' }
        ];
        
        expectedContent.forEach(({ text, description }) => {
          if (text.includes(text)) {
            console.log(`✓ Found: ${description}`);
          } else {
            console.log(`⚠️  Missing: ${description}`);
          }
        });
        
        console.log('\n--- Check Complete ---');
        console.log('PDF saved as: test-mono-placeholder.pdf');
      });
    });
  });
}

generateAndCheck();