#!/usr/bin/env node

const fs = require('fs');
const path = require('path');

// Files to clean up duplicates
const filesToClean = [
  'app/api/admin/auth/route.ts',
  'app/api/assessment/route.ts',
  'app/api/sms/unsubscribe/route.ts',
  'app/api/user-assessments/route.ts',
  'app/api/user-delete-data/route.ts',
  'app/api/verify-code/route.ts'
];

filesToClean.forEach(file => {
  const filePath = path.join(process.cwd(), file);
  
  if (!fs.existsSync(filePath)) {
    console.log(`Skipping ${file} - not found`);
    return;
  }
  
  const content = fs.readFileSync(filePath, 'utf-8');
  const lines = content.split('\n');
  
  // Find function boundaries
  const functions = [];
  for (let i = 0; i < lines.length; i++) {
    if (lines[i].match(/^export\s+(async\s+)?function\s+\w+/)) {
      // Find the opening brace
      let braceCount = 0;
      let startLine = i;
      let endLine = -1;
      
      for (let j = i; j < lines.length; j++) {
        braceCount += (lines[j].match(/{/g) || []).length;
        braceCount -= (lines[j].match(/}/g) || []).length;
        
        if (braceCount === 0 && j > i) {
          endLine = j;
          break;
        }
      }
      
      functions.push({ start: startLine, end: endLine });
    }
  }
  
  // Check each function for duplicate supabase declarations
  let modified = false;
  
  functions.forEach(func => {
    let firstSupabaseFound = false;
    
    for (let i = func.start; i <= func.end && i < lines.length; i++) {
      if (lines[i].includes('const supabase = supabaseAdmin()')) {
        if (!firstSupabaseFound) {
          firstSupabaseFound = true;
        } else {
          // This is a duplicate - comment it out
          lines[i] = lines[i].replace('const supabase = supabaseAdmin()', '// Duplicate removed: const supabase = supabaseAdmin()');
          modified = true;
          console.log(`Removed duplicate in ${file} at line ${i + 1}`);
        }
      }
    }
  });
  
  if (modified) {
    fs.writeFileSync(filePath, lines.join('\n'), 'utf-8');
    console.log(`Cleaned ${file}`);
  }
});

console.log('Done cleaning duplicates!');