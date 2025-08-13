#!/usr/bin/env node

const fs = require('fs');
const path = require('path');

// Files to check and fix
const files = [
  'app/api/admin/auth/route.ts',
  'app/api/admin/assessments/[id]/delete/route.ts',
  'app/api/assessment/route.ts', 
  'app/api/send-verification/route.ts',
  'app/api/sms/unsubscribe/route.ts',
  'app/api/user-assessments/route.ts',
  'app/api/user-delete-data/route.ts',
  'app/api/verify-code/route.ts'
];

function fixFile(filePath) {
  if (!fs.existsSync(filePath)) {
    console.log(`Skipping ${filePath} - not found`);
    return;
  }
  
  let content = fs.readFileSync(filePath, 'utf-8');
  let lines = content.split('\n');
  
  // Find all exported functions (GET, POST, PUT, PATCH, DELETE)
  const functionPatterns = [
    /export\s+async\s+function\s+(GET|POST|PUT|PATCH|DELETE)\s*\(/,
    /export\s+function\s+(GET|POST|PUT|PATCH|DELETE)\s*\(/
  ];
  
  const functions = [];
  for (let i = 0; i < lines.length; i++) {
    for (const pattern of functionPatterns) {
      const match = lines[i].match(pattern);
      if (match) {
        functions.push({
          name: match[1],
          lineIndex: i
        });
        break;
      }
    }
  }
  
  console.log(`Found ${functions.length} functions in ${path.basename(filePath)}: ${functions.map(f => f.name).join(', ')}`);
  
  // For each function, ensure it has const supabase = supabaseAdmin() at the start
  let modified = false;
  
  // Process functions in reverse order to avoid index shifting
  for (let f = functions.length - 1; f >= 0; f--) {
    const func = functions[f];
    
    // Find the opening brace for this function
    let braceIndex = -1;
    for (let i = func.lineIndex; i < lines.length; i++) {
      if (lines[i].includes('{')) {
        braceIndex = i;
        break;
      }
    }
    
    if (braceIndex === -1) continue;
    
    // Check if this function already has supabase declaration
    let hasSupabase = false;
    let nextFunctionIndex = f < functions.length - 1 ? functions[f + 1].lineIndex : lines.length;
    
    for (let i = braceIndex + 1; i < Math.min(braceIndex + 10, nextFunctionIndex); i++) {
      if (lines[i].includes('const supabase = supabaseAdmin()')) {
        hasSupabase = true;
        break;
      }
      // Check for the commented version too
      if (lines[i].includes('// Removed duplicate: const supabase = supabaseAdmin()')) {
        // Replace the comment with the actual declaration
        lines[i] = '  const supabase = supabaseAdmin();';
        hasSupabase = true;
        modified = true;
        console.log(`  Restored supabase declaration in ${func.name}`);
        break;
      }
    }
    
    if (!hasSupabase) {
      // Add the declaration right after the opening brace
      lines.splice(braceIndex + 1, 0, '  const supabase = supabaseAdmin();');
      modified = true;
      console.log(`  Added supabase declaration to ${func.name}`);
    }
  }
  
  if (modified) {
    fs.writeFileSync(filePath, lines.join('\n'), 'utf-8');
    console.log(`Fixed ${path.basename(filePath)}`);
  } else {
    console.log(`No changes needed for ${path.basename(filePath)}`);
  }
}

// Process all files
files.forEach(file => {
  const filePath = path.join(process.cwd(), file);
  fixFile(filePath);
  console.log('---');
});

console.log('Done!');