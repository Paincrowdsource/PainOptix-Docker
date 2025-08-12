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
  let lines = content.split('\n');
  
  // Find the function declaration
  let functionIndex = -1;
  for (let i = 0; i < lines.length; i++) {
    if (lines[i].includes('export async function') || lines[i].includes('export function')) {
      functionIndex = i;
      break;
    }
  }
  
  if (functionIndex === -1) {
    console.log(`Skipping ${file} - no function found`);
    return;
  }
  
  // Find where to insert the supabase declaration (after the opening brace)
  let insertIndex = -1;
  for (let i = functionIndex; i < lines.length; i++) {
    if (lines[i].includes('{')) {
      insertIndex = i + 1;
      break;
    }
  }
  
  if (insertIndex === -1) {
    console.log(`Skipping ${file} - no opening brace found`);
    return;
  }
  
  // Check if supabase is already declared at function scope
  let hasSupabaseAtFunctionScope = false;
  for (let i = insertIndex; i < Math.min(insertIndex + 5, lines.length); i++) {
    if (lines[i].includes('const supabase = supabaseAdmin()')) {
      hasSupabaseAtFunctionScope = true;
      break;
    }
  }
  
  if (!hasSupabaseAtFunctionScope) {
    // Insert the declaration at function scope
    lines.splice(insertIndex, 0, '  const supabase = supabaseAdmin();');
    console.log(`Added supabase declaration at function scope in ${file}`);
  }
  
  // Remove any duplicate declarations inside try blocks or elsewhere
  let removedCount = 0;
  for (let i = insertIndex + 1; i < lines.length; i++) {
    if (lines[i].includes('const supabase = supabaseAdmin()')) {
      lines[i] = lines[i].replace('const supabase = supabaseAdmin();', '// Removed duplicate: const supabase = supabaseAdmin();');
      removedCount++;
    }
  }
  
  if (removedCount > 0) {
    console.log(`  Removed ${removedCount} duplicate declaration(s) in ${file}`);
  }
  
  // Write back the file
  fs.writeFileSync(filePath, lines.join('\n'), 'utf-8');
  console.log(`Fixed ${file}`);
});

console.log('Done!');