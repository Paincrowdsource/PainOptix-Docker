#!/usr/bin/env node

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

// Find all TypeScript files that use supabaseAdmin
const apiDir = path.join(process.cwd(), 'app/api');

function findFiles(dir, pattern) {
  const results = [];
  
  function walk(currentDir) {
    const files = fs.readdirSync(currentDir);
    
    for (const file of files) {
      const filePath = path.join(currentDir, file);
      const stat = fs.statSync(filePath);
      
      if (stat.isDirectory()) {
        walk(filePath);
      } else if (file.endsWith('.ts')) {
        const content = fs.readFileSync(filePath, 'utf-8');
        if (content.includes('supabaseAdmin')) {
          results.push(filePath);
        }
      }
    }
  }
  
  walk(dir);
  return results;
}

const files = findFiles(apiDir);

console.log(`Found ${files.length} files using supabaseAdmin\n`);

files.forEach(file => {
  const relPath = path.relative(process.cwd(), file);
  const content = fs.readFileSync(file, 'utf-8');
  const lines = content.split('\n');
  
  // Find all functions (exported and internal)
  const functions = [];
  lines.forEach((line, i) => {
    if (line.match(/^export\s+(async\s+)?function\s+\w+/)) {
      functions.push({ type: 'exported', line: i + 1, text: line.trim() });
    } else if (line.match(/^async\s+function\s+\w+/) || line.match(/^function\s+\w+.*async/)) {
      functions.push({ type: 'internal', line: i + 1, text: line.trim() });
    }
  });
  
  // Find all supabase declarations
  const supabaseDecls = [];
  lines.forEach((line, i) => {
    if (line.includes('const supabase = supabaseAdmin()')) {
      supabaseDecls.push(i + 1);
    }
  });
  
  console.log(`=== ${relPath} ===`);
  console.log(`Functions: ${functions.length}`);
  functions.forEach(f => {
    console.log(`  Line ${f.line}: [${f.type}] ${f.text.substring(0, 50)}...`);
  });
  console.log(`Supabase declarations: ${supabaseDecls.length}`);
  supabaseDecls.forEach(line => {
    console.log(`  Line ${line}`);
  });
  
  // Check for issues
  const exportedFunctions = functions.filter(f => f.type === 'exported');
  const internalFunctions = functions.filter(f => f.type === 'internal');
  
  if (internalFunctions.length > 0 && supabaseDecls.length < functions.length) {
    console.log(`⚠️  WARNING: ${internalFunctions.length} internal functions but only ${supabaseDecls.length} supabase declarations`);
    console.log(`   Internal functions that might need supabase:`);
    internalFunctions.forEach(f => {
      console.log(`   - ${f.text.match(/function\s+(\w+)/)[1]} at line ${f.line}`);
    });
  }
  
  console.log('');
});