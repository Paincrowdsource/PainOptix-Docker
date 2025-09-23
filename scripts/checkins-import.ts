#!/usr/bin/env node
import 'dotenv/config';
import * as fs from 'fs';
import * as path from 'path';
import * as yaml from 'js-yaml';
import { parse as csvParse } from 'csv-parse/sync';
import { getServiceSupabase } from '@/lib/supabase';
import type { CheckInDay } from '@/lib/checkins/token';

interface MicroInsert {
  diagnosis_code: string;
  day: CheckInDay;
  branch: 'initial' | 'better' | 'same' | 'worse';
  insert_text: string;
}

interface ImportResult {
  inserted: number;
  updated: number;
  skipped: number;
  errors: string[];
}

const FORBIDDEN_PHRASES = [
  'guaranteed',
  'cure',
  'eliminate',
  'miracle',
  'breakthrough',
  'medical emergency',
  'call 911',
  'immediate surgery',
  'proven to work',
  '100%',
  'risk-free',
  'money-back',
  'clinical trial',
  'FDA approved',
  'doctor recommended'
];

const MAX_ROWS = 300;
const MAX_WORDS = 25;

function countWords(text: string): number {
  return text.trim().split(/\s+/).length;
}

function validateInsert(insert: MicroInsert, index: number): string | null {
  // Validate day
  if (![3, 7, 14].includes(insert.day)) {
    return `Row ${index + 1}: Invalid day ${insert.day}. Must be 3, 7, or 14.`;
  }

  // Validate branch
  if (!['initial', 'better', 'same', 'worse'].includes(insert.branch)) {
    return `Row ${index + 1}: Invalid branch "${insert.branch}". Must be initial, better, same, or worse.`;
  }

  // Validate word count
  const wordCount = countWords(insert.insert_text);
  if (wordCount > MAX_WORDS) {
    return `Row ${index + 1}: Insert text has ${wordCount} words (max ${MAX_WORDS}): "${insert.insert_text.substring(0, 50)}..."`;
  }

  // Validate forbidden phrases
  const lowerText = insert.insert_text.toLowerCase();
  for (const phrase of FORBIDDEN_PHRASES) {
    if (lowerText.includes(phrase.toLowerCase())) {
      return `Row ${index + 1}: Contains forbidden phrase "${phrase}"`;
    }
  }

  // Validate diagnosis code format
  if (!insert.diagnosis_code || insert.diagnosis_code.trim() === '') {
    return `Row ${index + 1}: Missing diagnosis_code`;
  }

  if (insert.diagnosis_code.length > 50) {
    return `Row ${index + 1}: diagnosis_code too long (max 50 chars)`;
  }

  return null;
}

async function loadFile(filePath: string): Promise<MicroInsert[]> {
  const ext = path.extname(filePath).toLowerCase();
  const content = fs.readFileSync(filePath, 'utf8');

  let data: MicroInsert[];

  if (ext === '.csv') {
    // Parse CSV
    const records = csvParse(content, {
      columns: true,
      skip_empty_lines: true,
      trim: true
    });

    data = records.map((record: any) => ({
      diagnosis_code: record.diagnosis_code,
      day: parseInt(record.day, 10) as CheckInDay,
      branch: record.branch,
      insert_text: record.insert_text
    }));
  } else if (ext === '.yaml' || ext === '.yml') {
    // Parse YAML
    const parsed = yaml.load(content) as any;
    if (!Array.isArray(parsed)) {
      throw new Error('YAML file must contain an array of inserts');
    }

    data = parsed.map((item: any) => ({
      diagnosis_code: item.diagnosis_code,
      day: item.day,
      branch: item.branch,
      insert_text: item.insert_text
    }));
  } else {
    throw new Error(`Unsupported file format: ${ext}. Use .csv or .yaml`);
  }

  // Check row count limit
  if (data.length > MAX_ROWS) {
    throw new Error(`File contains ${data.length} rows (max ${MAX_ROWS}). Please split into multiple files.`);
  }

  return data;
}

async function importInserts(
  inserts: MicroInsert[],
  dryRun: boolean = false
): Promise<ImportResult> {
  const result: ImportResult = {
    inserted: 0,
    updated: 0,
    skipped: 0,
    errors: []
  };

  if (!process.env.SUPABASE_SERVICE_ROLE_KEY) {
    throw new Error('SUPABASE_SERVICE_ROLE_KEY environment variable is required');
  }

  const supabase = getServiceSupabase();

  // Validate all inserts first
  for (let i = 0; i < inserts.length; i++) {
    const error = validateInsert(inserts[i], i);
    if (error) {
      result.errors.push(error);
      result.skipped++;
    }
  }

  // If there are validation errors, don't proceed
  if (result.errors.length > 0) {
    console.error('\n❌ Validation errors found:');
    result.errors.forEach(err => console.error(`  ${err}`));
    return result;
  }

  // Process valid inserts
  for (const insert of inserts) {
    try {
      if (dryRun) {
        // Check if exists
        const { data: existing } = await supabase
          .from('diagnosis_inserts')
          .select('id')
          .eq('diagnosis_code', insert.diagnosis_code)
          .eq('day', insert.day)
          .eq('branch', insert.branch)
          .single();

        if (existing) {
          console.log(`[DRY RUN] Would update: ${insert.diagnosis_code} day ${insert.day} ${insert.branch}`);
          result.updated++;
        } else {
          console.log(`[DRY RUN] Would insert: ${insert.diagnosis_code} day ${insert.day} ${insert.branch}`);
          result.inserted++;
        }
      } else {
        // Upsert the insert
        const { data, error } = await supabase
          .from('diagnosis_inserts')
          .upsert({
            diagnosis_code: insert.diagnosis_code,
            day: insert.day,
            branch: insert.branch,
            insert_text: insert.insert_text
          }, {
            onConflict: 'diagnosis_code,day,branch'
          })
          .select();

        if (error) {
          result.errors.push(`Failed to upsert ${insert.diagnosis_code} day ${insert.day} ${insert.branch}: ${error.message}`);
          result.skipped++;
        } else {
          // For simplicity, count as inserted since upsert handles both
          result.inserted++;
        }
      }
    } catch (error: any) {
      result.errors.push(`Error processing ${insert.diagnosis_code}: ${error.message}`);
      result.skipped++;
    }
  }

  return result;
}

// Main CLI
async function main() {
  const args = process.argv.slice(2);

  // Parse arguments
  let filePath: string | null = null;
  let dryRun = false;

  for (let i = 0; i < args.length; i++) {
    if (args[i] === '--file' && i + 1 < args.length) {
      filePath = args[i + 1];
      i++;
    } else if (args[i] === '--dry-run') {
      dryRun = true;
    } else if (args[i] === '--help' || args[i] === '-h') {
      console.log(`
Check-ins Content Importer

Usage:
  npx tsx scripts/checkins-import.ts --file <path> [--dry-run]

Options:
  --file <path>    Path to CSV or YAML file with micro-inserts
  --dry-run        Preview changes without writing to database

File format (CSV):
  diagnosis_code,day,branch,insert_text
  sciatica,3,initial,Short gentle movement breaks today.

File format (YAML):
  - diagnosis_code: sciatica
    day: 3
    branch: initial
    insert_text: Short gentle movement breaks today.

Validation:
  - Max ${MAX_WORDS} words per insert
  - Max ${MAX_ROWS} rows per file
  - Days must be 3, 7, or 14
  - Branch must be initial, better, same, or worse
  - No forbidden medical phrases

Example:
  npx tsx scripts/checkins-import.ts --file content/checkins/micro-inserts.csv --dry-run
      `);
      process.exit(0);
    }
  }

  if (!filePath) {
    console.error('❌ Error: --file argument is required');
    console.log('Run with --help for usage information');
    process.exit(1);
  }

  if (!fs.existsSync(filePath)) {
    console.error(`❌ Error: File not found: ${filePath}`);
    process.exit(1);
  }

  try {
    console.log(`\n📚 Check-ins Content Importer`);
    console.log(`File: ${filePath}`);
    console.log(`Mode: ${dryRun ? 'DRY RUN' : 'LIVE'}\n`);

    // Load and validate file
    const inserts = await loadFile(filePath);
    console.log(`Loaded ${inserts.length} inserts from file\n`);

    // Import
    const result = await importInserts(inserts, dryRun);

    // Print summary
    console.log('\n📊 Import Summary:');
    console.log(`  ✅ Inserted: ${result.inserted}`);
    console.log(`  📝 Updated: ${result.updated}`);
    console.log(`  ⏭️  Skipped: ${result.skipped}`);

    if (result.errors.length > 0) {
      console.log(`  ❌ Errors: ${result.errors.length}`);
      console.error('\nErrors:');
      result.errors.forEach(err => console.error(`  ${err}`));
      process.exit(1);
    }

    if (dryRun) {
      console.log('\n💡 This was a dry run. Use without --dry-run to apply changes.');
    } else {
      console.log('\n✅ Import completed successfully!');
    }
  } catch (error: any) {
    console.error(`\n❌ Import failed: ${error.message}`);
    process.exit(1);
  }
}

// Run if executed directly
if (require.main === module) {
  main().catch(error => {
    console.error('Fatal error:', error);
    process.exit(1);
  });
}