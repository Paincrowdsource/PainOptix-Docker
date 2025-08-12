#!/usr/bin/env node

const fs = require('fs');
const path = require('path');

// Files to fix
const files = [
  'app/api/admin/auth/route.ts',
  'app/api/assessment/route.ts', 
  'app/api/send-verification/route.ts',
  'app/api/sms/unsubscribe/route.ts',
  'app/api/user-assessments/route.ts',
  'app/api/user-delete-data/route.ts',
  'app/api/verify-code/route.ts'
];

files.forEach(file => {
  const filePath = path.join(process.cwd(), file);
  
  if (!fs.existsSync(filePath)) {
    console.log(`Skipping ${file} - not found`);
    return;
  }
  
  let content = fs.readFileSync(filePath, 'utf-8');
  
  // Check if it needs fixing
  if (!content.includes('await supabaseAdmin()')) {
    console.log(`Skipping ${file} - already fixed`);
    return;
  }
  
  // Check if supabase variable already exists in the function
  const hasSupabaseVar = content.includes('const supabase = supabaseAdmin()');
  
  if (!hasSupabaseVar) {
    // Find the first occurrence of supabaseAdmin() and add the variable declaration
    const lines = content.split('\n');
    let modified = false;
    
    for (let i = 0; i < lines.length; i++) {
      if (lines[i].includes('await supabaseAdmin()')) {
        // Insert the variable declaration before this line
        const indent = lines[i].match(/^(\s*)/)[1];
        lines.splice(i, 0, `${indent}const supabase = supabaseAdmin();`);
        modified = true;
        break;
      }
    }
    
    if (modified) {
      content = lines.join('\n');
    }
  }
  
  // Replace all occurrences of supabaseAdmin() with supabase
  content = content.replace(/await supabaseAdmin\(\)/g, 'await supabase');
  
  fs.writeFileSync(filePath, content, 'utf-8');
  console.log(`Fixed ${file}`);
});

console.log('Done!');